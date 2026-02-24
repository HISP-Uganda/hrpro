package services

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"hrpro/internal/audit"
	"hrpro/internal/models"
	"hrpro/internal/repositories"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInactiveUser       = errors.New("user is inactive")
	ErrRefreshInvalid     = errors.New("auth.refresh_invalid")
	ErrRefreshExpired     = errors.New("auth.refresh_expired")
	ErrRefreshReused      = errors.New("auth.refresh_reused")
)

type AuthService struct {
	users              repositories.UserRepository
	refreshTokens      repositories.RefreshTokenRepository
	tokenService       *TokenService
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
	auditRecorder      audit.Recorder
}

type LoginResult struct {
	AccessToken  string
	RefreshToken string
	User         models.User
}

func NewAuthService(
	users repositories.UserRepository,
	refreshTokens repositories.RefreshTokenRepository,
	tokenService *TokenService,
	accessTokenExpiry time.Duration,
	refreshTokenExpiry time.Duration,
) *AuthService {
	return &AuthService{
		users:              users,
		refreshTokens:      refreshTokens,
		tokenService:       tokenService,
		accessTokenExpiry:  accessTokenExpiry,
		refreshTokenExpiry: refreshTokenExpiry,
		auditRecorder:      audit.NewNoopRecorder(),
	}
}

func (s *AuthService) SetAuditRecorder(recorder audit.Recorder) {
	if recorder == nil {
		s.auditRecorder = audit.NewNoopRecorder()
		return
	}

	s.auditRecorder = recorder
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	cleanedUsername := strings.TrimSpace(username)
	if cleanedUsername == "" || password == "" {
		s.auditRecorder.RecordAuditEvent(ctx, nil, "user.login.fail", nil, nil, map[string]any{
			"username": cleanedUsername,
		})
		return nil, ErrInvalidCredentials
	}

	user, err := s.users.GetByUsername(ctx, cleanedUsername)
	if err != nil {
		return nil, err
	}

	if user == nil {
		s.auditRecorder.RecordAuditEvent(ctx, nil, "user.login.fail", nil, nil, map[string]any{
			"username": cleanedUsername,
		})
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		s.auditRecorder.RecordAuditEvent(ctx, &user.ID, "user.login.fail", strPtr("user"), &user.ID, map[string]any{
			"username": user.Username,
		})
		return nil, ErrInactiveUser
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		s.auditRecorder.RecordAuditEvent(ctx, &user.ID, "user.login.fail", strPtr("user"), &user.ID, map[string]any{
			"username": user.Username,
		})
		return nil, ErrInvalidCredentials
	}

	accessToken, err := s.tokenService.CreateAccessToken(*user, s.accessTokenExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	tokenHash := hashToken(refreshToken)
	expiresAt := time.Now().Add(s.refreshTokenExpiry)

	if err := s.refreshTokens.Store(ctx, user.ID, tokenHash, expiresAt); err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	if err := s.users.UpdateLastLoginAt(ctx, user.ID, now); err != nil {
		return nil, err
	}
	user.LastLoginAt = &now
	s.auditRecorder.RecordAuditEvent(ctx, &user.ID, "user.login.success", strPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
	})
	s.auditRecorder.RecordAuditEvent(ctx, &user.ID, "token.refresh", strPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
		"source":   "login",
	})

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         *user,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return nil
	}

	_, err := s.refreshTokens.RevokeByHash(ctx, hashToken(refreshToken))
	return err
}

func (s *AuthService) Refresh(ctx context.Context, refreshToken string) (*LoginResult, error) {
	token := strings.TrimSpace(refreshToken)
	if token == "" {
		return nil, ErrRefreshInvalid
	}

	tokenHash := hashToken(token)
	stored, err := s.refreshTokens.GetByHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}
	if stored == nil {
		return nil, ErrRefreshInvalid
	}
	if stored.RevokedAt != nil {
		_ = s.refreshTokens.RevokeAllByUserID(ctx, stored.UserID)
		s.auditRecorder.RecordAuditEvent(ctx, &stored.UserID, "token.refresh.reuse", strPtr("user"), &stored.UserID, nil)
		return nil, ErrRefreshReused
	}
	if time.Now().After(stored.ExpiresAt) {
		_, _ = s.refreshTokens.RevokeByHash(ctx, tokenHash)
		return nil, ErrRefreshExpired
	}

	user, err := s.users.GetByID(ctx, stored.UserID)
	if err != nil {
		return nil, err
	}
	if user == nil || !user.IsActive {
		return nil, ErrRefreshInvalid
	}

	revoked, err := s.refreshTokens.RevokeByHash(ctx, tokenHash)
	if err != nil {
		return nil, err
	}
	if !revoked {
		_ = s.refreshTokens.RevokeAllByUserID(ctx, stored.UserID)
		s.auditRecorder.RecordAuditEvent(ctx, &stored.UserID, "token.refresh.reuse", strPtr("user"), &stored.UserID, nil)
		return nil, ErrRefreshReused
	}

	accessToken, err := s.tokenService.CreateAccessToken(*user, s.accessTokenExpiry)
	if err != nil {
		return nil, err
	}

	nextRefreshToken, err := generateSecureToken()
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	nextTokenHash := hashToken(nextRefreshToken)
	expiresAt := time.Now().Add(s.refreshTokenExpiry)
	if err := s.refreshTokens.Store(ctx, user.ID, nextTokenHash, expiresAt); err != nil {
		return nil, err
	}

	s.auditRecorder.RecordAuditEvent(ctx, &user.ID, "token.refresh", strPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
		"source":   "refresh",
	})

	return &LoginResult{
		AccessToken:  accessToken,
		RefreshToken: nextRefreshToken,
		User:         *user,
	}, nil
}

func (s *AuthService) GetMe(ctx context.Context, accessToken string) (*models.User, error) {
	claims, err := s.tokenService.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, err
	}

	user, err := s.users.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *AuthService) SeedInitialAdmin(ctx context.Context, username, password, role string) error {
	if username == "" || password == "" || role == "" {
		return nil
	}

	existing, err := s.users.GetByUsername(ctx, username)
	if err != nil {
		return err
	}

	if existing != nil {
		return nil
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash initial admin password: %w", err)
	}

	_, err = s.users.CreateUser(ctx, username, string(hash), role, true)
	if err != nil {
		return err
	}

	return nil
}

func (s *AuthService) ValidateAccessToken(accessToken string) (*models.Claims, error) {
	claims, err := s.tokenService.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, err
	}

	return &models.Claims{
		UserID:   claims.UserID,
		Username: claims.Username,
		Role:     claims.Role,
	}, nil
}

func generateSecureToken() (string, error) {
	buffer := make([]byte, 32)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(buffer), nil
}

func hashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func strPtr(value string) *string {
	return &value
}
