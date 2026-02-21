package users

import (
	"context"
	"fmt"
	"strings"

	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"

	"golang.org/x/crypto/bcrypt"
)

var allowedRoles = map[string]struct{}{
	"admin":           {},
	"hr_officer":      {},
	"finance_officer": {},
	"viewer":          {},
}

type Service struct {
	repository Repository
	audit      audit.Recorder
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository, audit: audit.NewNoopRecorder()}
}

func (s *Service) SetAuditRecorder(recorder audit.Recorder) {
	if recorder == nil {
		s.audit = audit.NewNoopRecorder()
		return
	}
	s.audit = recorder
}

func (s *Service) ListUsers(ctx context.Context, _ *models.Claims, query ListUsersQuery) (*ListUsersResult, error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 10
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	items, total, err := s.repository.List(ctx, query)
	if err != nil {
		return nil, err
	}

	return &ListUsersResult{Items: items, TotalCount: total, Page: query.Page, PageSize: query.PageSize}, nil
}

func (s *Service) GetUser(ctx context.Context, _ *models.Claims, id int64) (*User, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	user, err := s.repository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrNotFound
	}
	return user, nil
}

func (s *Service) CreateUser(ctx context.Context, claims *models.Claims, input CreateUserInput) (*User, error) {
	username := strings.TrimSpace(input.Username)
	if username == "" {
		return nil, fmt.Errorf("%w: username is required", ErrValidation)
	}

	if len(input.Password) < 8 {
		return nil, fmt.Errorf("%w: password must be at least 8 characters", ErrValidation)
	}

	role, err := validateAndNormalizeRole(input.Role)
	if err != nil {
		return nil, err
	}

	exists, err := s.repository.ExistsByUsernameCaseInsensitive(ctx, username, nil)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateUsername
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user, err := s.repository.Create(ctx, username, string(hash), role)
	if err != nil {
		return nil, err
	}
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "user.create", stringPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
		"role":     user.Role,
	})
	return user, nil
}

func (s *Service) UpdateUser(ctx context.Context, claims *models.Claims, id int64, input UpdateUserInput) (*User, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}

	username := strings.TrimSpace(input.Username)
	if username == "" {
		return nil, fmt.Errorf("%w: username is required", ErrValidation)
	}

	role, err := validateAndNormalizeRole(input.Role)
	if err != nil {
		return nil, err
	}

	exists, err := s.repository.ExistsByUsernameCaseInsensitive(ctx, username, &id)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDuplicateUsername
	}

	if claims != nil && claims.UserID == id && middleware.NormalizeRole(claims.Role) == "admin" && role != "admin" {
		return nil, ErrCannotRemoveOwnAdmin
	}

	user, err := s.repository.Update(ctx, id, username, role)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrNotFound
	}
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "user.update", stringPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
		"role":     user.Role,
	})
	return user, nil
}

func (s *Service) ResetUserPassword(ctx context.Context, claims *models.Claims, id int64, input ResetUserPasswordInput) error {
	if id <= 0 {
		return fmt.Errorf("%w: id must be positive", ErrValidation)
	}
	if len(input.NewPassword) < 8 {
		return fmt.Errorf("%w: password must be at least 8 characters", ErrValidation)
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	updated, err := s.repository.UpdatePasswordHash(ctx, id, string(hash))
	if err != nil {
		return err
	}
	if !updated {
		return ErrNotFound
	}
	entityID := id
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "user.reset_password", stringPtr("user"), &entityID, map[string]any{
		"user_id": id,
	})
	return nil
}

func (s *Service) SetUserActive(ctx context.Context, claims *models.Claims, id int64, active bool) (*User, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: id must be positive", ErrValidation)
	}
	if claims != nil && claims.UserID == id && !active {
		return nil, ErrCannotDeactivateSelf
	}

	user, err := s.repository.SetActive(ctx, id, active)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, ErrNotFound
	}
	action := "user.deactivate"
	if active {
		action = "user.activate"
	}
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), action, stringPtr("user"), &user.ID, map[string]any{
		"username": user.Username,
		"active":   user.IsActive,
	})
	return user, nil
}

func validateAndNormalizeRole(role string) (string, error) {
	normalized := middleware.NormalizeRole(role)
	if _, ok := allowedRoles[normalized]; !ok {
		return "", fmt.Errorf("%w: role must be one of admin, hr_officer, finance_officer, viewer", ErrValidation)
	}
	return normalized, nil
}

func claimsUserID(claims *models.Claims) *int64 {
	if claims == nil || claims.UserID <= 0 {
		return nil
	}
	actor := claims.UserID
	return &actor
}

func stringPtr(value string) *string {
	return &value
}
