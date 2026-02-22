package reports

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct{}

func (f *fakeRepository) ListEmployeeReport(_ context.Context, _ EmployeeListFilter, _ PagerInput) ([]EmployeeReportRow, int64, int, int, error) {
	return []EmployeeReportRow{}, 0, 1, 10, nil
}

func (f *fakeRepository) ListEmployeeReportForExport(_ context.Context, _ EmployeeListFilter, _ int) ([]EmployeeReportRow, int64, error) {
	return []EmployeeReportRow{}, 0, nil
}

func (f *fakeRepository) ListLeaveRequestsReport(_ context.Context, _ LeaveRequestsFilter, _ time.Time, _ time.Time, _ PagerInput) ([]LeaveRequestsReportRow, int64, int, int, error) {
	return []LeaveRequestsReportRow{}, 0, 1, 10, nil
}

func (f *fakeRepository) ListLeaveRequestsReportForExport(_ context.Context, _ LeaveRequestsFilter, _ time.Time, _ time.Time, _ int) ([]LeaveRequestsReportRow, int64, error) {
	return []LeaveRequestsReportRow{}, 0, nil
}

func (f *fakeRepository) ListAttendanceSummaryReport(_ context.Context, _ AttendanceSummaryFilter, _ time.Time, _ time.Time, _ int, _ PagerInput) ([]AttendanceSummaryReportRow, int64, int, int, error) {
	return []AttendanceSummaryReportRow{}, 0, 1, 10, nil
}

func (f *fakeRepository) ListAttendanceSummaryReportForExport(_ context.Context, _ AttendanceSummaryFilter, _ time.Time, _ time.Time, _ int, _ int) ([]AttendanceSummaryReportRow, int64, error) {
	return []AttendanceSummaryReportRow{}, 0, nil
}

func (f *fakeRepository) ListPayrollBatchesReport(_ context.Context, _ PayrollBatchesFilter, _ PagerInput) ([]PayrollBatchesReportRow, int64, int, int, error) {
	return []PayrollBatchesReportRow{}, 0, 1, 10, nil
}

func (f *fakeRepository) ListPayrollBatchesReportForExport(_ context.Context, _ PayrollBatchesFilter, _ int) ([]PayrollBatchesReportRow, int64, error) {
	return []PayrollBatchesReportRow{}, 0, nil
}

func (f *fakeRepository) ListAuditLogReport(_ context.Context, _ AuditLogFilter, _ time.Time, _ time.Time, _ PagerInput) ([]AuditLogReportRow, int64, int, int, error) {
	return []AuditLogReportRow{}, 0, 1, 10, nil
}

func (f *fakeRepository) ListAuditLogReportForExport(_ context.Context, _ AuditLogFilter, _ time.Time, _ time.Time, _ int) ([]AuditLogReportRow, int64, error) {
	return []AuditLogReportRow{}, 0, nil
}

func TestDateRangeValidationRejectsInvalidDate(t *testing.T) {
	svc := NewService(&fakeRepository{})
	_, err := svc.ListAttendanceSummaryReport(context.Background(), &models.Claims{Role: "Admin"}, AttendanceSummaryFilter{
		DateFrom: "2026-13-01",
		DateTo:   "2026-02-01",
	}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected ErrValidation, got %v", err)
	}
}

func TestDateRangeValidationRejectsInvertedRange(t *testing.T) {
	svc := NewService(&fakeRepository{})
	_, err := svc.ListLeaveRequestsReport(context.Background(), &models.Claims{Role: "HR Officer"}, LeaveRequestsFilter{
		DateFrom: "2026-02-10",
		DateTo:   "2026-02-01",
	}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(err, ErrValidation) {
		t.Fatalf("expected ErrValidation, got %v", err)
	}
}

func TestFinanceCannotAccessAuditReport(t *testing.T) {
	svc := NewService(&fakeRepository{})
	_, err := svc.ListAuditLogReport(context.Background(), &models.Claims{Role: "Finance Officer"}, AuditLogFilter{
		DateFrom: "2026-02-01",
		DateTo:   "2026-02-21",
	}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(err, ErrAccessDenied) {
		t.Fatalf("expected ErrAccessDenied, got %v", err)
	}
}

func TestHRCannotAccessPayrollReport(t *testing.T) {
	svc := NewService(&fakeRepository{})
	_, err := svc.ListPayrollBatchesReport(context.Background(), &models.Claims{Role: "HR Officer"}, PayrollBatchesFilter{}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(err, ErrAccessDenied) {
		t.Fatalf("expected ErrAccessDenied, got %v", err)
	}
}

func TestViewerDeniedPayrollAndAuditReports(t *testing.T) {
	svc := NewService(&fakeRepository{})

	_, payrollErr := svc.ListPayrollBatchesReport(context.Background(), &models.Claims{Role: "Viewer"}, PayrollBatchesFilter{}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(payrollErr, ErrAccessDenied) {
		t.Fatalf("expected payroll ErrAccessDenied, got %v", payrollErr)
	}

	_, auditErr := svc.ListAuditLogReport(context.Background(), &models.Claims{Role: "Viewer"}, AuditLogFilter{
		DateFrom: "2026-02-01",
		DateTo:   "2026-02-21",
	}, PagerInput{Page: 1, PageSize: 10})
	if !errors.Is(auditErr, ErrAccessDenied) {
		t.Fatalf("expected audit ErrAccessDenied, got %v", auditErr)
	}
}
