package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/attendance"
	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type AttendanceAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type AttendanceHandler struct {
	authService AttendanceAuthService
	service     *attendance.Service
}

type ListAttendanceByDateRequest struct {
	AccessToken string `json:"accessToken"`
	Date        string `json:"date"`
}

type UpsertAttendanceRequest struct {
	AccessToken string  `json:"accessToken"`
	Date        string  `json:"date"`
	EmployeeID  int64   `json:"employeeId"`
	Status      string  `json:"status"`
	Reason      *string `json:"reason"`
}

type GetMyAttendanceRangeRequest struct {
	AccessToken string `json:"accessToken"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
}

type GetLunchSummaryRequest struct {
	AccessToken string `json:"accessToken"`
	Date        string `json:"date"`
}

type UpsertLunchVisitorsRequest struct {
	AccessToken   string `json:"accessToken"`
	Date          string `json:"date"`
	VisitorsCount int    `json:"visitorsCount"`
}

type PostAbsentToLeaveRequest struct {
	AccessToken string `json:"accessToken"`
	Date        string `json:"date"`
	EmployeeID  int64  `json:"employeeId"`
}

func NewAttendanceHandler(authService AttendanceAuthService, service *attendance.Service) *AttendanceHandler {
	return &AttendanceHandler{authService: authService, service: service}
}

func (h *AttendanceHandler) ListAttendanceByDate(ctx context.Context, request ListAttendanceByDateRequest) ([]attendance.AttendanceRow, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	items, err := h.service.ListAttendanceByDate(ctx, claims, request.Date)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return items, nil
}

func (h *AttendanceHandler) UpsertAttendance(ctx context.Context, request UpsertAttendanceRequest) (*attendance.AttendanceRecord, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	item, err := h.service.UpsertAttendance(ctx, claims, request.Date, request.EmployeeID, request.Status, request.Reason)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return item, nil
}

func (h *AttendanceHandler) GetMyAttendanceRange(ctx context.Context, request GetMyAttendanceRangeRequest) ([]attendance.AttendanceRecord, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	items, err := h.service.GetMyAttendanceRange(ctx, claims, request.StartDate, request.EndDate)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return items, nil
}

func (h *AttendanceHandler) GetLunchSummary(ctx context.Context, request GetLunchSummaryRequest) (*attendance.LunchSummary, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	summary, err := h.service.GetLunchSummary(ctx, claims, request.Date)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return summary, nil
}

func (h *AttendanceHandler) UpsertLunchVisitors(ctx context.Context, request UpsertLunchVisitorsRequest) (*attendance.LunchSummary, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	summary, err := h.service.UpsertLunchVisitors(ctx, claims, request.Date, request.VisitorsCount)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return summary, nil
}

func (h *AttendanceHandler) PostAbsentToLeave(ctx context.Context, request PostAbsentToLeaveRequest) (*attendance.PostAbsentToLeaveResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.PostAbsentToLeave(ctx, claims, request.Date, request.EmployeeID)
	if err != nil {
		return nil, mapAttendanceError(err)
	}
	return result, nil
}

func (h *AttendanceHandler) validateClaims(accessToken string) (*models.Claims, error) {
	return validateAuthClaims(h.authService, accessToken)
}

func mapAttendanceError(err error) error {
	switch {
	case errors.Is(err, attendance.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, attendance.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, attendance.ErrLocked):
		return fmt.Errorf("record locked: %w", err)
	case errors.Is(err, attendance.ErrNotAbsent):
		return fmt.Errorf("status check failed: %w", err)
	case errors.Is(err, attendance.ErrLeaveIntegration):
		return fmt.Errorf("leave integration failed: %w", err)
	case errors.Is(err, attendance.ErrForbidden), errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
