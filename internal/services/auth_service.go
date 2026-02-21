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

	"hrpro/internal/models"
	"hrpro/internal/repositories"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInactiveUser       = errors.New("user is inactive")
)

type AuthService struct {
	users              repositories.UserRepository
	refreshTokens      repositories.RefreshTokenRepository
	tokenService       *TokenService
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
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
	}
}

func (s *AuthService) Login(ctx context.Context, username, password string) (*LoginResult, error) {
	cleanedUsername := strings.TrimSpace(username)
	if cleanedUsername == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	user, err := s.users.GetByUsername(ctx, cleanedUsername)
	if err != nil {
		return nil, err
	}

	if user == nil {
		return nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, ErrInactiveUser
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
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

	return s.refreshTokens.RevokeByHash(ctx, hashToken(refreshToken))
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
