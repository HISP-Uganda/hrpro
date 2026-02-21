package handlers

import (
	"context"
	"errors"
	"fmt"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
	"hrpro/internal/payroll"
)

type PayrollAuthService interface {
	ValidateAccessToken(accessToken string) (*models.Claims, error)
}

type PayrollHandler struct {
	authService PayrollAuthService
	service     *payroll.Service
}

type ListPayrollBatchesRequest struct {
	AccessToken string                    `json:"accessToken"`
	Filter      payroll.ListBatchesFilter `json:"filter"`
}

type CreatePayrollBatchRequest struct {
	AccessToken string                   `json:"accessToken"`
	Payload     payroll.CreateBatchInput `json:"payload"`
}

type GetPayrollBatchRequest struct {
	AccessToken string `json:"accessToken"`
	BatchID     int64  `json:"batchId"`
}

type PayrollBatchActionRequest struct {
	AccessToken string `json:"accessToken"`
	BatchID     int64  `json:"batchId"`
}

type UpdatePayrollEntryAmountsRequest struct {
	AccessToken string                          `json:"accessToken"`
	EntryID     int64                           `json:"entryId"`
	Payload     payroll.UpdateEntryAmountsInput `json:"payload"`
}

func NewPayrollHandler(authService PayrollAuthService, service *payroll.Service) *PayrollHandler {
	return &PayrollHandler{authService: authService, service: service}
}

func (h *PayrollHandler) ListPayrollBatches(ctx context.Context, request ListPayrollBatchesRequest) (*payroll.ListBatchesResult, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	result, err := h.service.ListPayrollBatches(ctx, request.Filter)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return result, nil
}

func (h *PayrollHandler) CreatePayrollBatch(ctx context.Context, request CreatePayrollBatchRequest) (*payroll.PayrollBatch, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	batch, err := h.service.CreatePayrollBatch(ctx, claims, request.Payload)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return batch, nil
}

func (h *PayrollHandler) GetPayrollBatch(ctx context.Context, request GetPayrollBatchRequest) (*payroll.PayrollBatchDetail, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	detail, err := h.service.GetPayrollBatch(ctx, request.BatchID)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return detail, nil
}

func (h *PayrollHandler) GeneratePayrollEntries(ctx context.Context, request PayrollBatchActionRequest) error {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return err
	}

	if err := h.service.GeneratePayrollEntries(ctx, request.BatchID); err != nil {
		return mapPayrollError(err)
	}
	return nil
}

func (h *PayrollHandler) UpdatePayrollEntryAmounts(ctx context.Context, request UpdatePayrollEntryAmountsRequest) (*payroll.PayrollEntry, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	entry, err := h.service.UpdatePayrollEntryAmounts(ctx, request.EntryID, request.Payload)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return entry, nil
}

func (h *PayrollHandler) ApprovePayrollBatch(ctx context.Context, request PayrollBatchActionRequest) (*payroll.PayrollBatch, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	batch, err := h.service.ApprovePayrollBatch(ctx, claims, request.BatchID)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return batch, nil
}

func (h *PayrollHandler) LockPayrollBatch(ctx context.Context, request PayrollBatchActionRequest) (*payroll.PayrollBatch, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return nil, err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return nil, err
	}

	batch, err := h.service.LockPayrollBatch(ctx, request.BatchID)
	if err != nil {
		return nil, mapPayrollError(err)
	}
	return batch, nil
}

func (h *PayrollHandler) ExportPayrollBatchCSV(ctx context.Context, request PayrollBatchActionRequest) (string, error) {
	claims, err := h.validateClaims(request.AccessToken)
	if err != nil {
		return "", err
	}
	if err := middleware.RequireRoles(claims, "Admin", "Finance Officer"); err != nil {
		return "", err
	}

	csvText, err := h.service.ExportPayrollBatchCSV(ctx, request.BatchID)
	if err != nil {
		return "", mapPayrollError(err)
	}
	return csvText, nil
}

func (h *PayrollHandler) validateClaims(accessToken string) (*models.Claims, error) {
	claims, err := h.authService.ValidateAccessToken(extractBearerToken(accessToken))
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func mapPayrollError(err error) error {
	switch {
	case errors.Is(err, payroll.ErrValidation):
		return fmt.Errorf("validation error: %w", err)
	case errors.Is(err, payroll.ErrDuplicateMonth):
		return fmt.Errorf("duplicate month: %w", err)
	case errors.Is(err, payroll.ErrNotFound):
		return fmt.Errorf("not found: %w", err)
	case errors.Is(err, payroll.ErrInvalidTransition):
		return fmt.Errorf("invalid status transition: %w", err)
	case errors.Is(err, payroll.ErrImmutableBatch):
		return fmt.Errorf("batch is immutable: %w", err)
	case errors.Is(err, payroll.ErrExportNotAllowed):
		return fmt.Errorf("export not allowed: %w", err)
	case errors.Is(err, payroll.ErrForbidden), errors.Is(err, middleware.ErrForbidden):
		return middleware.ErrForbidden
	default:
		return err
	}
}
