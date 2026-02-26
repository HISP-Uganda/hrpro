package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/employees"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type EmployeesAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type EmployeesHandler struct {
	authService EmployeesAuthService
	service     *employees.Service
}

type CreateEmployeeRequest struct {
	AccessToken string                        `json:"accessToken"`
	Payload     employees.UpsertEmployeeInput `json:"payload"`
}

type UpdateEmployeeRequest struct {
	AccessToken string                        `json:"accessToken"`
	ID          int64                         `json:"id"`
	Payload     employees.UpsertEmployeeInput `json:"payload"`
}

type DeleteEmployeeRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type GetEmployeeRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type ListEmployeesRequest struct {
	AccessToken  string `json:"accessToken"`
	Page         int    `json:"page"`
	PageSize     int    `json:"pageSize"`
	Q            string `json:"q"`
	Status       string `json:"status"`
	DepartmentID *int64 `json:"departmentId"`
}

type EmployeeListResponse struct {
	Items      []employees.Employee `json:"items"`
	TotalCount int64                `json:"totalCount"`
	Page       int                  `json:"page"`
	PageSize   int                  `json:"pageSize"`
}

type UploadEmployeeContractRequest struct {
	AccessToken string `json:"accessToken"`
	EmployeeID  int64  `json:"employeeId"`
	Filename    string `json:"filename"`
	MimeType    string `json:"mimeType"`
	Data        []byte `json:"data"`
}

type RemoveEmployeeContractRequest struct {
	AccessToken string `json:"accessToken"`
	EmployeeID  int64  `json:"employeeId"`
}

func NewEmployeesHandler(authService EmployeesAuthService, service *employees.Service) *EmployeesHandler {
	return &EmployeesHandler{authService: authService, service: service}
}

func (h *EmployeesHandler) CreateEmployee(ctx context.Context, request CreateEmployeeRequest) (*employees.Employee, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	employee, err := h.service.CreateEmployee(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapEmployeeError(err)
	}

	return employee, nil
}

func (h *EmployeesHandler) UpdateEmployee(ctx context.Context, request UpdateEmployeeRequest) (*employees.Employee, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	employee, err := h.service.UpdateEmployee(ctx, claims, request.ID, request.Payload)
	if err != nil {
		return nil, mapEmployeeError(err)
	}

	return employee, nil
}

func (h *EmployeesHandler) DeleteEmployee(ctx context.Context, request DeleteEmployeeRequest) error {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return err
	}

	if err := h.service.DeleteEmployee(ctx, claims, request.ID); err != nil {
		return mapEmployeeError(err)
	}

	return nil
}

func (h *EmployeesHandler) GetEmployee(ctx context.Context, request GetEmployeeRequest) (*employees.Employee, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer", "Finance Officer", "Viewer"); err != nil {
		return nil, err
	}

	employee, err := h.service.GetEmployee(ctx, claims, request.ID)
	if err != nil {
		return nil, mapEmployeeError(err)
	}

	return employee, nil
}

func (h *EmployeesHandler) ListEmployees(ctx context.Context, request ListEmployeesRequest) (*EmployeeListResponse, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	if err := middleware.RequireRoles(claims, "Admin", "HR Officer", "Finance Officer", "Viewer"); err != nil {
		return nil, err
	}

	result, err := h.service.ListEmployees(ctx, claims, employees.ListEmployeesQuery{
		Page:         request.Page,
		PageSize:     request.PageSize,
		Q:            request.Q,
		Status:       request.Status,
		DepartmentID: request.DepartmentID,
	})
	if err != nil {
		return nil, mapEmployeeError(err)
	}

	return &EmployeeListResponse{
		Items:      result.Items,
		TotalCount: result.TotalCount,
		Page:       result.Page,
		PageSize:   result.PageSize,
	}, nil
}

func (h *EmployeesHandler) UploadEmployeeContract(ctx context.Context, request UploadEmployeeContractRequest) (*employees.Employee, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	employee, err := h.service.UploadEmployeeContract(ctx, claims, request.EmployeeID, request.Filename, request.MimeType, request.Data)
	if err != nil {
		return nil, mapEmployeeError(err)
	}
	return employee, nil
}

func (h *EmployeesHandler) RemoveEmployeeContract(ctx context.Context, request RemoveEmployeeContractRequest) (*employees.Employee, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	employee, err := h.service.RemoveEmployeeContract(ctx, claims, request.EmployeeID)
	if err != nil {
		return nil, mapEmployeeError(err)
	}
	return employee, nil
}

func (h *EmployeesHandler) validateClaims(accessToken string) (*models.Claims, error) {
	return validateAuthClaims(h.authService, accessToken)
}

func mapEmployeeError(err error) error {
	switch {
	case errors.Is(err, employees.ErrValidation):
		var fieldErr *employees.FieldValidationError
		if errors.As(err, &fieldErr) {
			return fmt.Errorf("validation error [field=%s]: %s", fieldErr.Field, fieldErr.Message)
		}
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, employees.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
