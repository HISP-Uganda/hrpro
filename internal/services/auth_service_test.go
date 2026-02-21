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

func (f *fakeRefreshRepo) RevokeByHash(_ context.Context, _ string) error {
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
