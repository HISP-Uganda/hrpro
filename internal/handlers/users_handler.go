package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/users"
)

type UsersAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type UsersHandler struct {
	authService UsersAuthService
	service     *users.Service
}

type ListUsersRequest struct {
	AccessToken string `json:"accessToken"`
	Page        int    `json:"page"`
	PageSize    int    `json:"pageSize"`
	Q           string `json:"q"`
}

type GetUserRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type CreateUserRequest struct {
	AccessToken string                `json:"accessToken"`
	Payload     users.CreateUserInput `json:"payload"`
}

type UpdateUserRequest struct {
	AccessToken string                `json:"accessToken"`
	ID          int64                 `json:"id"`
	Payload     users.UpdateUserInput `json:"payload"`
}

type ResetUserPasswordRequest struct {
	AccessToken string                       `json:"accessToken"`
	ID          int64                        `json:"id"`
	Payload     users.ResetUserPasswordInput `json:"payload"`
}

type SetUserActiveRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
	Active      bool   `json:"active"`
}

func NewUsersHandler(authService UsersAuthService, service *users.Service) *UsersHandler {
	return &UsersHandler{authService: authService, service: service}
}

func (h *UsersHandler) ListUsers(ctx context.Context, request ListUsersRequest) (*users.ListUsersResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, err
	}

	result, err := h.service.ListUsers(ctx, claims, users.ListUsersQuery{Page: request.Page, PageSize: request.PageSize, Q: request.Q})
	if err != nil {
		return nil, mapUsersError(err)
	}
	return result, nil
}

func (h *UsersHandler) GetUser(ctx context.Context, request GetUserRequest) (*users.User, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, err
	}

	item, err := h.service.GetUser(ctx, claims, request.ID)
	if err != nil {
		return nil, mapUsersError(err)
	}
	return item, nil
}

func (h *UsersHandler) CreateUser(ctx context.Context, request CreateUserRequest) (*users.User, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, err
	}

	item, err := h.service.CreateUser(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapUsersError(err)
	}
	return item, nil
}

func (h *UsersHandler) UpdateUser(ctx context.Context, request UpdateUserRequest) (*users.User, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, err
	}

	item, err := h.service.UpdateUser(ctx, claims, request.ID, request.Payload)
	if err != nil {
		return nil, mapUsersError(err)
	}
	return item, nil
}

func (h *UsersHandler) ResetUserPassword(ctx context.Context, request ResetUserPasswordRequest) error {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return err
	}

	if err := h.service.ResetUserPassword(ctx, claims, request.ID, request.Payload); err != nil {
		return mapUsersError(err)
	}
	return nil
}

func (h *UsersHandler) SetUserActive(ctx context.Context, request SetUserActiveRequest) (*users.User, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "admin"); err != nil {
		return nil, err
	}

	item, err := h.service.SetUserActive(ctx, claims, request.ID, request.Active)
	if err != nil {
		return nil, mapUsersError(err)
	}
	return item, nil
}

func (h *UsersHandler) validateClaims(accessToken string) (*models.Claims, error) {
	claims, err := h.authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func mapUsersError(err error) error {
	switch {
	case errors.Is(err, users.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, users.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, users.ErrDuplicateUsername):
		return fmt.Errorf("duplicate username: %w", err)
	case errors.Is(err, users.ErrCannotDeactivateSelf):
		return fmt.Errorf("cannot deactivate self: %w", err)
	case errors.Is(err, users.ErrCannotRemoveOwnAdmin):
		return fmt.Errorf("cannot remove own admin role: %w", err)
	case errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
