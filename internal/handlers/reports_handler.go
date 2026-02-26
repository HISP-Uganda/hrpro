package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/reports"
)

type ReportsAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type ReportsHandler struct {
	authService ReportsAuthService
	service     *reports.Service
}

type ListEmployeeReportRequest struct {
	AccessToken string                     `json:"accessToken"`
	Filters     reports.EmployeeListFilter `json:"filters"`
	Pager       reports.PagerInput         `json:"pager"`
}

type ExportEmployeeReportRequest struct {
	AccessToken string                     `json:"accessToken"`
	Filters     reports.EmployeeListFilter `json:"filters"`
}

type ListLeaveRequestsReportRequest struct {
	AccessToken string                      `json:"accessToken"`
	Filters     reports.LeaveRequestsFilter `json:"filters"`
	Pager       reports.PagerInput          `json:"pager"`
}

type ExportLeaveRequestsReportRequest struct {
	AccessToken string                      `json:"accessToken"`
	Filters     reports.LeaveRequestsFilter `json:"filters"`
}

type ListAttendanceSummaryReportRequest struct {
	AccessToken string                          `json:"accessToken"`
	Filters     reports.AttendanceSummaryFilter `json:"filters"`
	Pager       reports.PagerInput              `json:"pager"`
}

type ExportAttendanceSummaryReportRequest struct {
	AccessToken string                          `json:"accessToken"`
	Filters     reports.AttendanceSummaryFilter `json:"filters"`
}

type ListPayrollBatchesReportRequest struct {
	AccessToken string                       `json:"accessToken"`
	Filters     reports.PayrollBatchesFilter `json:"filters"`
	Pager       reports.PagerInput           `json:"pager"`
}

type ExportPayrollBatchesReportRequest struct {
	AccessToken string                       `json:"accessToken"`
	Filters     reports.PayrollBatchesFilter `json:"filters"`
}

type ListAuditLogReportRequest struct {
	AccessToken string                 `json:"accessToken"`
	Filters     reports.AuditLogFilter `json:"filters"`
	Pager       reports.PagerInput     `json:"pager"`
}

type ExportAuditLogReportRequest struct {
	AccessToken string                 `json:"accessToken"`
	Filters     reports.AuditLogFilter `json:"filters"`
}

func NewReportsHandler(authService ReportsAuthService, service *reports.Service) *ReportsHandler {
	return &ReportsHandler{authService: authService, service: service}
}

func (h *ReportsHandler) ListEmployeeReport(ctx context.Context, request ListEmployeeReportRequest) (*reports.EmployeeReportListResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.ListEmployeeReport(ctx, claims, request.Filters, request.Pager)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return result, nil
}

func (h *ReportsHandler) ExportEmployeeReportCSV(ctx context.Context, request ExportEmployeeReportRequest) (*reports.CSVExport, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	exportResult, err := h.service.ExportEmployeeReportCSV(ctx, claims, request.Filters)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return exportResult, nil
}

func (h *ReportsHandler) ListLeaveRequestsReport(ctx context.Context, request ListLeaveRequestsReportRequest) (*reports.LeaveRequestsReportListResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.ListLeaveRequestsReport(ctx, claims, request.Filters, request.Pager)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return result, nil
}

func (h *ReportsHandler) ExportLeaveRequestsReportCSV(ctx context.Context, request ExportLeaveRequestsReportRequest) (*reports.CSVExport, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	exportResult, err := h.service.ExportLeaveRequestsReportCSV(ctx, claims, request.Filters)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return exportResult, nil
}

func (h *ReportsHandler) ListAttendanceSummaryReport(ctx context.Context, request ListAttendanceSummaryReportRequest) (*reports.AttendanceSummaryReportListResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.ListAttendanceSummaryReport(ctx, claims, request.Filters, request.Pager)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return result, nil
}

func (h *ReportsHandler) ExportAttendanceSummaryReportCSV(ctx context.Context, request ExportAttendanceSummaryReportRequest) (*reports.CSVExport, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	exportResult, err := h.service.ExportAttendanceSummaryReportCSV(ctx, claims, request.Filters)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return exportResult, nil
}

func (h *ReportsHandler) ListPayrollBatchesReport(ctx context.Context, request ListPayrollBatchesReportRequest) (*reports.PayrollBatchesReportListResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.ListPayrollBatchesReport(ctx, claims, request.Filters, request.Pager)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return result, nil
}

func (h *ReportsHandler) ExportPayrollBatchesReportCSV(ctx context.Context, request ExportPayrollBatchesReportRequest) (*reports.CSVExport, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	exportResult, err := h.service.ExportPayrollBatchesReportCSV(ctx, claims, request.Filters)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return exportResult, nil
}

func (h *ReportsHandler) ListAuditLogReport(ctx context.Context, request ListAuditLogReportRequest) (*reports.AuditLogReportListResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	result, err := h.service.ListAuditLogReport(ctx, claims, request.Filters, request.Pager)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return result, nil
}

func (h *ReportsHandler) ExportAuditLogReportCSV(ctx context.Context, request ExportAuditLogReportRequest) (*reports.CSVExport, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	ctx = audit.WithActorUserID(ctx, claims.UserID)

	exportResult, err := h.service.ExportAuditLogReportCSV(ctx, claims, request.Filters)
	if err != nil {
		return nil, mapReportsError(err)
	}
	return exportResult, nil
}

func (h *ReportsHandler) validateClaims(accessToken string) (*models.Claims, error) {
	return validateAuthClaims(h.authService, accessToken)
}

func mapReportsError(err error) error {
	switch {
	case errors.Is(err, reports.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, reports.ErrExportLimitExceeded):
		return fmt.Errorf("export limit exceeded: %w", err)
	case errors.Is(err, reports.ErrAccessDenied), errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
