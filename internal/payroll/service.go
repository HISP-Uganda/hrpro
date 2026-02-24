package payroll

import (
	"bytes"
	"context"
	"encoding/csv"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"hrpro/internal/audit"
	"hrpro/internal/models"
)

var payrollMonthPattern = regexp.MustCompile(`^\d{4}-\d{2}$`)

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

func (s *Service) ListPayrollBatches(ctx context.Context, filter ListBatchesFilter) (*ListBatchesResult, error) {
	if filter.Status != "" && !isAllowedStatus(filter.Status) {
		return nil, fmt.Errorf("%w: invalid payroll status", ErrValidation)
	}

	items, total, page, pageSize, err := s.repository.ListBatches(ctx, filter)
	if err != nil {
		return nil, err
	}

	return &ListBatchesResult{
		Items:      items,
		TotalCount: total,
		Page:       page,
		PageSize:   pageSize,
	}, nil
}

func (s *Service) CreatePayrollBatch(ctx context.Context, claims *models.Claims, input CreateBatchInput) (*PayrollBatch, error) {
	if claims == nil {
		return nil, ErrForbidden
	}

	month := strings.TrimSpace(input.Month)
	if !payrollMonthPattern.MatchString(month) {
		return nil, fmt.Errorf("%w: month must be in YYYY-MM format", ErrValidation)
	}

	batch, err := s.repository.CreateBatch(ctx, month, claims.UserID)
	if err != nil {
		return nil, err
	}
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "payroll.batch.create", stringPtr("payroll_batch"), &batch.ID, map[string]any{
		"month": month,
	})

	return batch, nil
}

func (s *Service) GetPayrollBatch(ctx context.Context, batchID int64) (*PayrollBatchDetail, error) {
	if batchID <= 0 {
		return nil, fmt.Errorf("%w: batch id must be positive", ErrValidation)
	}

	batch, err := s.repository.GetBatchByID(ctx, batchID)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return nil, ErrNotFound
	}

	entries, err := s.repository.ListEntriesByBatchID(ctx, batchID)
	if err != nil {
		return nil, err
	}

	return &PayrollBatchDetail{Batch: *batch, Entries: entries}, nil
}

func (s *Service) GeneratePayrollEntries(ctx context.Context, batchID int64) error {
	if batchID <= 0 {
		return fmt.Errorf("%w: batch id must be positive", ErrValidation)
	}

	batch, err := s.repository.GetBatchByID(ctx, batchID)
	if err != nil {
		return err
	}
	if batch == nil {
		return ErrNotFound
	}
	if batch.Status != StatusDraft {
		return ErrImmutableBatch
	}

	entriesGenerated := 0
	err = s.repository.WithTx(ctx, func(tx TxRepository) error {
		if err := tx.DeleteEntriesByBatchID(ctx, batchID); err != nil {
			return err
		}

		employees, err := tx.ListActiveEmployeeSalaries(ctx)
		if err != nil {
			return err
		}

		for _, employee := range employees {
			grossPay, netPay := CalculateTotals(employee.BaseSalary, 0, 0, 0)
			if err := tx.CreateEntry(ctx, EntryCreateInput{
				BatchID:         batchID,
				EmployeeID:      employee.EmployeeID,
				BaseSalary:      employee.BaseSalary,
				AllowancesTotal: 0,
				DeductionsTotal: 0,
				TaxTotal:        0,
				GrossPay:        grossPay,
				NetPay:          netPay,
			}); err != nil {
				return err
			}
			entriesGenerated++
		}

		return nil
	})
	if err != nil {
		return err
	}
	s.audit.RecordAuditEvent(ctx, nil, "payroll.batch.generate", stringPtr("payroll_batch"), &batchID, map[string]any{
		"month":             batch.Month,
		"entries_generated": entriesGenerated,
	})
	return nil
}

func (s *Service) UpdatePayrollEntryAmounts(ctx context.Context, entryID int64, input UpdateEntryAmountsInput) (*PayrollEntry, error) {
	if entryID <= 0 {
		return nil, fmt.Errorf("%w: entry id must be positive", ErrValidation)
	}
	if input.AllowancesTotal < 0 || input.DeductionsTotal < 0 || input.TaxTotal < 0 {
		return nil, fmt.Errorf("%w: amounts must be non-negative", ErrValidation)
	}

	batch, err := s.repository.GetBatchByEntryID(ctx, entryID)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return nil, ErrNotFound
	}
	if batch.Status != StatusDraft {
		return nil, ErrImmutableBatch
	}

	detail, err := s.GetPayrollBatch(ctx, batch.ID)
	if err != nil {
		return nil, err
	}

	var existing *PayrollEntry
	for i := range detail.Entries {
		if detail.Entries[i].ID == entryID {
			existing = &detail.Entries[i]
			break
		}
	}
	if existing == nil {
		return nil, ErrNotFound
	}

	grossPay, netPay := CalculateTotals(existing.BaseSalary, input.AllowancesTotal, input.DeductionsTotal, input.TaxTotal)
	updated, err := s.repository.UpdateEntryAmounts(ctx, entryID, input.AllowancesTotal, input.DeductionsTotal, input.TaxTotal, grossPay, netPay)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}
	s.audit.RecordAuditEvent(ctx, nil, "payroll.entry.update", stringPtr("payroll_entry"), &updated.ID, map[string]any{
		"batch_id":         updated.BatchID,
		"employee_id":      updated.EmployeeID,
		"allowances_total": updated.AllowancesTotal,
		"deductions_total": updated.DeductionsTotal,
		"tax_total":        updated.TaxTotal,
	})
	return updated, nil
}

func (s *Service) ApprovePayrollBatch(ctx context.Context, claims *models.Claims, batchID int64) (*PayrollBatch, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if batchID <= 0 {
		return nil, fmt.Errorf("%w: batch id must be positive", ErrValidation)
	}

	batch, err := s.repository.GetBatchByID(ctx, batchID)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return nil, ErrNotFound
	}
	if batch.Status != StatusDraft {
		return nil, ErrInvalidTransition
	}

	updated, err := s.repository.SetBatchApproved(ctx, batchID, claims.UserID)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}
	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "payroll.batch.approve", stringPtr("payroll_batch"), &updated.ID, map[string]any{
		"month":  updated.Month,
		"status": updated.Status,
	})
	return updated, nil
}

func (s *Service) LockPayrollBatch(ctx context.Context, batchID int64) (*PayrollBatch, error) {
	if batchID <= 0 {
		return nil, fmt.Errorf("%w: batch id must be positive", ErrValidation)
	}

	batch, err := s.repository.GetBatchByID(ctx, batchID)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return nil, ErrNotFound
	}
	if batch.Status != StatusApproved {
		return nil, ErrInvalidTransition
	}

	updated, err := s.repository.SetBatchLocked(ctx, batchID)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}
	s.audit.RecordAuditEvent(ctx, nil, "payroll.batch.lock", stringPtr("payroll_batch"), &updated.ID, map[string]any{
		"month":  updated.Month,
		"status": updated.Status,
	})
	return updated, nil
}

func (s *Service) ExportPayrollBatchCSV(ctx context.Context, batchID int64) (*CSVExport, error) {
	if batchID <= 0 {
		return nil, fmt.Errorf("%w: batch id must be positive", ErrValidation)
	}

	batch, err := s.repository.GetBatchByID(ctx, batchID)
	if err != nil {
		return nil, err
	}
	if batch == nil {
		return nil, ErrNotFound
	}
	if batch.Status != StatusApproved && batch.Status != StatusLocked {
		return nil, ErrExportNotAllowed
	}

	entries, err := s.repository.ListEntriesByBatchID(ctx, batchID)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	writer := csv.NewWriter(&buf)
	if err := writer.Write([]string{
		"Employee ID",
		"Employee Name",
		"Base Salary",
		"Allowances",
		"Deductions",
		"Tax",
		"Gross Pay",
		"Net Pay",
	}); err != nil {
		return nil, fmt.Errorf("write payroll csv header: %w", err)
	}

	for _, entry := range entries {
		record := []string{
			strconv.FormatInt(entry.EmployeeID, 10),
			entry.EmployeeName,
			formatMoney(entry.BaseSalary),
			formatMoney(entry.AllowancesTotal),
			formatMoney(entry.DeductionsTotal),
			formatMoney(entry.TaxTotal),
			formatMoney(entry.GrossPay),
			formatMoney(entry.NetPay),
		}
		if err := writer.Write(record); err != nil {
			return nil, fmt.Errorf("write payroll csv record: %w", err)
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("flush payroll csv: %w", err)
	}

	return &CSVExport{
		Filename: fmt.Sprintf("payroll-%s.csv", batch.Month),
		Data:     buf.String(),
		MimeType: "text/csv;charset=utf-8",
	}, nil
}

func isAllowedStatus(status string) bool {
	return status == StatusDraft || status == StatusApproved || status == StatusLocked
}

func formatMoney(value float64) string {
	return strconv.FormatFloat(value, 'f', 2, 64)
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
