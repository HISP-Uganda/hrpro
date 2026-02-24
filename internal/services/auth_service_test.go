package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type fakeAuthUserRepo struct {
	user             *models.User
	updatedLoginAtID int64
}

func (f *fakeAuthUserRepo) GetByUsername(_ context.Context, _ string) (*models.User, error) {
	return f.user, nil
}

func (f *fakeAuthUserRepo) GetByID(_ context.Context, _ int64) (*models.User, error) {
	return f.user, nil
}

func (f *fakeAuthUserRepo) CreateUser(_ context.Context, _, _, _ string, _ bool) (*models.User, error) {
	return nil, nil
}

func (f *fakeAuthUserRepo) UpdateLastLoginAt(_ context.Context, id int64, _ time.Time) error {
	f.updatedLoginAtID = id
	return nil
}

type fakeRefreshRepo struct{}

func (f *fakeRefreshRepo) Store(_ context.Context, _ int64, _ string, _ time.Time) error {
	return nil
}

func (f *fakeRefreshRepo) GetByHash(_ context.Context, _ string) (*models.RefreshToken, error) {
	return nil, nil
}

func (f *fakeRefreshRepo) RevokeByHash(_ context.Context, _ string) (bool, error) {
	return true, nil
}

func (f *fakeRefreshRepo) RevokeAllByUserID(_ context.Context, _ int64) error {
	return nil
}

type fakeRefreshRepoWithState struct {
	byHash         map[string]*models.RefreshToken
	revokeAllCalls int
	revokedByHash  map[string]bool
}

func newFakeRefreshRepoWithState() *fakeRefreshRepoWithState {
	return &fakeRefreshRepoWithState{
		byHash:        map[string]*models.RefreshToken{},
		revokedByHash: map[string]bool{},
	}
}

func (f *fakeRefreshRepoWithState) Store(_ context.Context, userID int64, tokenHash string, expiresAt time.Time) error {
	f.byHash[tokenHash] = &models.RefreshToken{
		UserID:    userID,
		TokenHash: tokenHash,
		ExpiresAt: expiresAt,
	}
	return nil
}

func (f *fakeRefreshRepoWithState) GetByHash(_ context.Context, tokenHash string) (*models.RefreshToken, error) {
	return f.byHash[tokenHash], nil
}

func (f *fakeRefreshRepoWithState) RevokeByHash(_ context.Context, tokenHash string) (bool, error) {
	token := f.byHash[tokenHash]
	if token == nil || token.RevokedAt != nil {
		return false, nil
	}
	now := time.Now()
	token.RevokedAt = &now
	f.revokedByHash[tokenHash] = true
	return true, nil
}

func (f *fakeRefreshRepoWithState) RevokeAllByUserID(_ context.Context, userID int64) error {
	f.revokeAllCalls++
	now := time.Now()
	for _, token := range f.byHash {
		if token.UserID == userID && token.RevokedAt == nil {
			token.RevokedAt = &now
		}
	}
	return nil
}

type captureAuditRecorder struct {
	actions []string
}

func (c *captureAuditRecorder) RecordAuditEvent(_ context.Context, _ *int64, action string, _ *string, _ *int64, _ map[string]any) {
	c.actions = append(c.actions, action)
}

func TestLoginRecordsSuccessAndTokenRefreshAuditEvents(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}

	userRepo := &fakeAuthUserRepo{user: &models.User{ID: 7, Username: "admin", PasswordHash: string(hash), Role: "admin", IsActive: true}}
	service := NewAuthService(userRepo, &fakeRefreshRepo{}, NewTokenService("test-secret"), time.Minute, time.Hour)
	capture := &captureAuditRecorder{}
	service.SetAuditRecorder(capture)

	_, err = service.Login(context.Background(), "admin", "password123")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if userRepo.updatedLoginAtID != 7 {
		t.Fatalf("expected last login update for user 7, got %d", userRepo.updatedLoginAtID)
	}

	if len(capture.actions) < 2 {
		t.Fatalf("expected audit events, got %v", capture.actions)
	}

	if capture.actions[0] != "user.login.success" {
		t.Fatalf("expected first audit action user.login.success, got %q", capture.actions[0])
	}

	if capture.actions[1] != "token.refresh" {
		t.Fatalf("expected second audit action token.refresh, got %q", capture.actions[1])
	}
}

func TestLoginRecordsFailAuditEvent(t *testing.T) {
	userRepo := &fakeAuthUserRepo{user: nil}
	service := NewAuthService(userRepo, &fakeRefreshRepo{}, NewTokenService("test-secret"), time.Minute, time.Hour)
	capture := &captureAuditRecorder{}
	service.SetAuditRecorder(capture)

	_, err := service.Login(context.Background(), "missing", "password123")
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected invalid credentials error, got %v", err)
	}

	if len(capture.actions) != 1 || capture.actions[0] != "user.login.fail" {
		t.Fatalf("expected one user.login.fail event, got %v", capture.actions)
	}
}

func TestRefreshRotatesTokens(t *testing.T) {
	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatalf("hash password: %v", err)
	}

	user := &models.User{ID: 9, Username: "admin", PasswordHash: string(hash), Role: "admin", IsActive: true}
	userRepo := &fakeAuthUserRepo{user: user}
	refreshRepo := newFakeRefreshRepoWithState()
	service := NewAuthService(userRepo, refreshRepo, NewTokenService("test-secret"), time.Minute, time.Hour)

	result, err := service.Login(context.Background(), "admin", "password123")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}

	currentHash := hashToken(result.RefreshToken)
	if refreshRepo.byHash[currentHash] == nil {
		t.Fatalf("expected login refresh token to be stored")
	}

	refreshed, err := service.Refresh(context.Background(), result.RefreshToken)
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if refreshed.AccessToken == "" || refreshed.RefreshToken == "" {
		t.Fatalf("expected refreshed token pair")
	}
	if refreshed.RefreshToken == result.RefreshToken {
		t.Fatalf("expected refresh token rotation")
	}
	if refreshRepo.byHash[currentHash] == nil || refreshRepo.byHash[currentHash].RevokedAt == nil {
		t.Fatalf("expected original refresh token to be revoked")
	}
}

func TestRefreshReturnsReuseErrorForRevokedToken(t *testing.T) {
	userRepo := &fakeAuthUserRepo{user: &models.User{ID: 5, Username: "admin", Role: "admin", IsActive: true}}
	refreshRepo := newFakeRefreshRepoWithState()
	service := NewAuthService(userRepo, refreshRepo, NewTokenService("test-secret"), time.Minute, time.Hour)

	token := "revoked-token"
	tokenHash := hashToken(token)
	now := time.Now()
	refreshRepo.byHash[tokenHash] = &models.RefreshToken{
		UserID:    5,
		TokenHash: tokenHash,
		ExpiresAt: now.Add(time.Hour),
		RevokedAt: &now,
	}

	_, err := service.Refresh(context.Background(), token)
	if !errors.Is(err, ErrRefreshReused) {
		t.Fatalf("expected refresh reused error, got %v", err)
	}
	if refreshRepo.revokeAllCalls == 0 {
		t.Fatalf("expected revoke-all call on refresh reuse")
	}
}
