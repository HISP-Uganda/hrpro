package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/leave"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type LeaveAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type LeaveHandler struct {
	authService LeaveAuthService
	service     *leave.Service
}

type LeaveRequestBase struct {
	AccessToken string `json:"accessToken"`
}

type ListLeaveTypesRequest struct {
	AccessToken string `json:"accessToken"`
	ActiveOnly  bool   `json:"activeOnly"`
}

type CreateLeaveTypeRequest struct {
	AccessToken string                     `json:"accessToken"`
	Payload     leave.LeaveTypeUpsertInput `json:"payload"`
}

type UpdateLeaveTypeRequest struct {
	AccessToken string                     `json:"accessToken"`
	ID          int64                      `json:"id"`
	Payload     leave.LeaveTypeUpsertInput `json:"payload"`
}

type SetLeaveTypeActiveRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
	Active      bool   `json:"active"`
}

type ListLockedDatesRequest struct {
	AccessToken string `json:"accessToken"`
	Year        int    `json:"year"`
}

type LockDateRequest struct {
	AccessToken string `json:"accessToken"`
	Date        string `json:"date"`
	Reason      string `json:"reason"`
}

type UnlockDateRequest struct {
	AccessToken string `json:"accessToken"`
	Date        string `json:"date"`
}

type LeaveBalanceRequest struct {
	AccessToken string `json:"accessToken"`
	EmployeeID  int64  `json:"employeeId"`
	Year        int    `json:"year"`
}

type UpsertEntitlementRequest struct {
	AccessToken string                       `json:"accessToken"`
	Payload     leave.UpsertEntitlementInput `json:"payload"`
}

type ApplyLeaveRequest struct {
	AccessToken string                `json:"accessToken"`
	Payload     leave.ApplyLeaveInput `json:"payload"`
}

type ListLeaveRequestsRequest struct {
	AccessToken string                        `json:"accessToken"`
	Filter      leave.ListLeaveRequestsFilter `json:"filter"`
}

type LeaveActionRequest struct {
	AccessToken string `json:"accessToken"`
	ID          int64  `json:"id"`
}

type RejectLeaveRequest struct {
	AccessToken string  `json:"accessToken"`
	ID          int64   `json:"id"`
	Reason      *string `json:"reason"`
}

func NewLeaveHandler(authService LeaveAuthService, service *leave.Service) *LeaveHandler {
	return &LeaveHandler{authService: authService, service: service}
}

func (h *LeaveHandler) ListLeaveTypes(ctx context.Context, request ListLeaveTypesRequest) ([]leave.LeaveType, error) {
	if _, err := h.validateClaims(request.AccessToken); err != nil {
		return nil, err
	}

	items, err := h.service.ListLeaveTypes(ctx, request.ActiveOnly)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return items, nil
}

func (h *LeaveHandler) CreateLeaveType(ctx context.Context, request CreateLeaveTypeRequest) (*leave.LeaveType, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.CreateLeaveType(ctx, request.Payload)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) UpdateLeaveType(ctx context.Context, request UpdateLeaveTypeRequest) (*leave.LeaveType, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.UpdateLeaveType(ctx, request.ID, request.Payload)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) SetLeaveTypeActive(ctx context.Context, request SetLeaveTypeActiveRequest) (*leave.LeaveType, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.SetLeaveTypeActive(ctx, request.ID, request.Active)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) ListLockedDates(ctx context.Context, request ListLockedDatesRequest) ([]leave.LeaveLockedDate, error) {
	if _, err := h.validateClaims(request.AccessToken); err != nil {
		return nil, err
	}

	items, err := h.service.ListLockedDates(ctx, request.Year)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return items, nil
}

func (h *LeaveHandler) LockDate(ctx context.Context, request LockDateRequest) (*leave.LeaveLockedDate, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.LockDate(ctx, claims, request.Date, request.Reason)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) UnlockDate(ctx context.Context, request UnlockDateRequest) error {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return err
	}

	if err := h.service.UnlockDate(ctx, request.Date); err != nil {
		return mapLeaveError(err)
	}
	return nil
}

func (h *LeaveHandler) GetMyLeaveBalance(ctx context.Context, request LeaveBalanceRequest) (*leave.LeaveBalance, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	balance, err := h.service.GetMyLeaveBalance(ctx, claims, request.Year)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return balance, nil
}

func (h *LeaveHandler) GetLeaveBalance(ctx context.Context, request LeaveBalanceRequest) (*leave.LeaveBalance, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	balance, err := h.service.GetLeaveBalance(ctx, request.EmployeeID, request.Year)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return balance, nil
}

func (h *LeaveHandler) UpsertEntitlement(ctx context.Context, request UpsertEntitlementRequest) (*leave.LeaveEntitlement, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.UpsertEntitlement(ctx, request.Payload)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) ApplyLeave(ctx context.Context, request ApplyLeaveRequest) (*leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	item, err := h.service.ApplyLeave(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) ListMyLeaveRequests(ctx context.Context, request ListLeaveRequestsRequest) ([]leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	items, err := h.service.ListMyLeaveRequests(ctx, claims, request.Filter)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return items, nil
}

func (h *LeaveHandler) ListAllLeaveRequests(ctx context.Context, request ListLeaveRequestsRequest) ([]leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	items, err := h.service.ListAllLeaveRequests(ctx, request.Filter)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return items, nil
}

func (h *LeaveHandler) ApproveLeave(ctx context.Context, request LeaveActionRequest) (*leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.ApproveLeave(ctx, claims, request.ID)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) RejectLeave(ctx context.Context, request RejectLeaveRequest) (*leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "HR Officer"); err != nil {
		return nil, err
	}

	item, err := h.service.RejectLeave(ctx, claims, request.ID, request.Reason)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) CancelLeave(ctx context.Context, request LeaveActionRequest) (*leave.LeaveRequest, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}

	item, err := h.service.CancelLeave(ctx, claims, request.ID)
	if err != nil {
		return nil, mapLeaveError(err)
	}
	return item, nil
}

func (h *LeaveHandler) validateClaims(accessToken string) (*models.Claims, error) {
	claims, err := h.authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func mapLeaveError(err error) error {
	switch {
	case errors.Is(err, leave.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, leave.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, leave.ErrLockedDateConflict):
		return fmt.Errorf("locked date conflict: %w", err)
	case errors.Is(err, leave.ErrOverlapApproved):
		return fmt.Errorf("approved leave overlap: %w", err)
	case errors.Is(err, leave.ErrInsufficientBalance):
		return fmt.Errorf("insufficient balance: %w", err)
	case errors.Is(err, leave.ErrInvalidTransition):
		return fmt.Errorf("invalid status transition: %w", err)
	case errors.Is(err, leave.ErrForbidden), errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
