package users

import (
	"context"
	"errors"
	"testing"

	"hrpro/internal/audit"
	"hrpro/internal/models"

	"golang.org/x/crypto/bcrypt"
)

type fakeRepository struct {
	existsByUsername bool
	capturedHash     string
}

type captureAuditRecorder struct {
	actions []string
}

func (c *captureAuditRecorder) RecordAuditEvent(_ context.Context, _ *int64, action string, _ *string, _ *int64, _ map[string]any) {
	c.actions = append(c.actions, action)
}

type failingAuditRepository struct{}

func (f *failingAuditRepository) Insert(_ context.Context, _ audit.CreateAuditLogInput) error {
	return errors.New("insert audit failed")
}

func (f *fakeRepository) GetByID(_ context.Context, id int64) (*User, error) {
	return &User{ID: id, Username: "john", Role: "viewer", IsActive: true}, nil
}

func (f *fakeRepository) List(_ context.Context, _ ListUsersQuery) ([]User, int64, error) {
	return []User{}, 0, nil
}

func (f *fakeRepository) ExistsByUsernameCaseInsensitive(_ context.Context, _ string, _ *int64) (bool, error) {
	return f.existsByUsername, nil
}

func (f *fakeRepository) Create(_ context.Context, username, passwordHash, role string) (*User, error) {
	f.capturedHash = passwordHash
	return &User{ID: 1, Username: username, Role: role, IsActive: true}, nil
}

func (f *fakeRepository) Update(_ context.Context, id int64, username, role string) (*User, error) {
	return &User{ID: id, Username: username, Role: role, IsActive: true}, nil
}

func (f *fakeRepository) UpdatePasswordHash(_ context.Context, _ int64, _ string) (bool, error) {
	return true, nil
}

func (f *fakeRepository) SetActive(_ context.Context, id int64, active bool) (*User, error) {
	return &User{ID: id, Username: "john", Role: "viewer", IsActive: active}, nil
}

func TestCreateUserRejectsDuplicateUsername(t *testing.T) {
	service := NewService(&fakeRepository{existsByUsername: true})

	_, err := service.CreateUser(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, CreateUserInput{
		Username: "john",
		Password: "password123",
		Role:     "viewer",
	})

	if !errors.Is(err, ErrDuplicateUsername) {
		t.Fatalf("expected duplicate username error, got %v", err)
	}
}

func TestCreateUserHashesPassword(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)

	_, err := service.CreateUser(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, CreateUserInput{
		Username: "john",
		Password: "password123",
		Role:     "finance_officer",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if repo.capturedHash == "password123" || repo.capturedHash == "" {
		t.Fatalf("expected hashed password, got %q", repo.capturedHash)
	}

	if compareErr := bcrypt.CompareHashAndPassword([]byte(repo.capturedHash), []byte("password123")); compareErr != nil {
		t.Fatalf("expected valid bcrypt hash, got %v", compareErr)
	}
}

func TestSetUserActiveCannotDeactivateSelf(t *testing.T) {
	service := NewService(&fakeRepository{})

	_, err := service.SetUserActive(context.Background(), &models.Claims{UserID: 42, Role: "admin"}, 42, false)
	if !errors.Is(err, ErrCannotDeactivateSelf) {
		t.Fatalf("expected cannot deactivate self error, got %v", err)
	}
}

func TestCreateUserRecordsAuditEvent(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	recorder := &captureAuditRecorder{}
	service.SetAuditRecorder(recorder)

	_, err := service.CreateUser(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, CreateUserInput{
		Username: "jane",
		Password: "password123",
		Role:     "viewer",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recorder.actions) != 1 || recorder.actions[0] != "user.create" {
		t.Fatalf("expected user.create audit action, got %v", recorder.actions)
	}
}

func TestCreateUserSucceedsWhenAuditInsertFails(t *testing.T) {
	repo := &fakeRepository{}
	service := NewService(repo)
	service.SetAuditRecorder(audit.NewService(&failingAuditRepository{}))

	_, err := service.CreateUser(context.Background(), &models.Claims{UserID: 1, Role: "admin"}, CreateUserInput{
		Username: "jane",
		Password: "password123",
		Role:     "viewer",
	})
	if err != nil {
		t.Fatalf("expected create user to succeed despite audit failure, got %v", err)
	}
}
