package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/departments"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type DepartmentsAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type DepartmentsHandler struct {
	authService DepartmentsAuthService
	service     *departments.Service
}

type CreateDepartmentRequest struct {
	AccessToken string                            `json:"accessToken"`
	Payload     departments.UpsertDepartmentInput `json:"payload"`
}

type UpdateDepartmentRequest struct {
	AccessToken string                            `json:"accessToken"`
	ID          int64                             `json:"id"`
	Payload     departments.UpsertDepartmentInput `json:"payload"`
}

type DeleteDepartmentRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type GetDepartmentRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type ListDepartmentsRequest struct {
	AccessToken string `json:"accessToken"`
	Page        int    `json:"page"`
	PageSize    int    `json:"pageSize"`
	Q           string `json:"q"`
}

type DepartmentListResponse struct {
	Items      []departments.Department `json:"items"`
	TotalCount int64                    `json:"totalCount"`
	Page       int                      `json:"page"`
	PageSize   int                      `json:"pageSize"`
}

func NewDepartmentsHandler(authService DepartmentsAuthService, service *departments.Service) *DepartmentsHandler {
	return &DepartmentsHandler{authService: authService, service: service}
}

func (h *DepartmentsHandler) CreateDepartment(ctx context.Context, request CreateDepartmentRequest) (*departments.Department, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	department, err := h.service.CreateDepartment(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapDepartmentError(err)
	}

	return department, nil
}

func (h *DepartmentsHandler) UpdateDepartment(ctx context.Context, request UpdateDepartmentRequest) (*departments.Department, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	department, err := h.service.UpdateDepartment(ctx, claims, request.ID, request.Payload)
	if err != nil {
		return nil, mapDepartmentError(err)
	}

	return department, nil
}

func (h *DepartmentsHandler) DeleteDepartment(ctx context.Context, request DeleteDepartmentRequest) error {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return err
	}

	if err := h.service.DeleteDepartment(ctx, claims, request.ID); err != nil {
		return mapDepartmentError(err)
	}

	return nil
}

func (h *DepartmentsHandler) GetDepartment(ctx context.Context, request GetDepartmentRequest) (*departments.Department, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer", "Finance Officer", "Viewer"); err != nil {
		return nil, err
	}

	department, err := h.service.GetDepartment(ctx, claims, request.ID)
	if err != nil {
		return nil, mapDepartmentError(err)
	}

	return department, nil
}

func (h *DepartmentsHandler) ListDepartments(ctx context.Context, request ListDepartmentsRequest) (*DepartmentListResponse, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer", "Finance Officer", "Viewer"); err != nil {
		return nil, err
	}

	result, err := h.service.ListDepartments(ctx, claims, departments.ListDepartmentsQuery{
		Page:     request.Page,
		PageSize: request.PageSize,
		Q:        request.Q,
	})
	if err != nil {
		return nil, mapDepartmentError(err)
	}

	return &DepartmentListResponse{
		Items:      result.Items,
		TotalCount: result.TotalCount,
		Page:       result.Page,
		PageSize:   result.PageSize,
	}, nil
}

func (h *DepartmentsHandler) validateClaims(accessToken string) (*models.Claims, error) {
	claims, err := h.authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, err
	}

	return claims, nil
}

func mapDepartmentError(err error) error {
	switch {
	case errors.Is(err, departments.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, departments.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, departments.ErrDuplicateName):
		return fmt.Errorf("duplicate department name: %w", err)
	case errors.Is(err, departments.ErrDepartmentHasEmployees):
		return fmt.Errorf("department has employees: %w", err)
	default:
		return err
	}
}
