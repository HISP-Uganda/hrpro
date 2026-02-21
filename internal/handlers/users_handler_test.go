package handlers

import (
	"context"
	"errors"
	"testing"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/users"
)

type fakeUsersAuthService struct {
	claims *models.Claims
}

func (f *fakeUsersAuthService) ValidateAccessToken(_ string) (*models.Claims, error) {
	return f.claims, nil
}

type fakeUsersRepository struct{}

func (f *fakeUsersRepository) GetByID(_ context.Context, _ int64) (*users.User, error) {
	return &users.User{ID: 1, Username: "admin", Role: "admin", IsActive: true}, nil
}

func (f *fakeUsersRepository) List(_ context.Context, _ users.ListUsersQuery) ([]users.User, int64, error) {
	return []users.User{}, 0, nil
}

func (f *fakeUsersRepository) ExistsByUsernameCaseInsensitive(_ context.Context, _ string, _ *int64) (bool, error) {
	return false, nil
}

func (f *fakeUsersRepository) Create(_ context.Context, username, _ string, role string) (*users.User, error) {
	return &users.User{ID: 2, Username: username, Role: role, IsActive: true}, nil
}

func (f *fakeUsersRepository) Update(_ context.Context, id int64, username, role string) (*users.User, error) {
	return &users.User{ID: id, Username: username, Role: role, IsActive: true}, nil
}

func (f *fakeUsersRepository) UpdatePasswordHash(_ context.Context, _ int64, _ string) (bool, error) {
	return true, nil
}

func (f *fakeUsersRepository) SetActive(_ context.Context, id int64, active bool) (*users.User, error) {
	return &users.User{ID: id, Username: "u", Role: "viewer", IsActive: active}, nil
}

func TestUsersHandlerListUsersRequiresAdmin(t *testing.T) {
	handler := NewUsersHandler(
		&fakeUsersAuthService{claims: &models.Claims{UserID: 10, Role: "viewer"}},
		users.NewService(&fakeUsersRepository{}),
	)

	_, err := handler.ListUsers(context.Background(), ListUsersRequest{
		AccessToken: "token",
		Page:        1,
		PageSize:    10,
	})
	if !errors.Is(err, middleware.ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}
