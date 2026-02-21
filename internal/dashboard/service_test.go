package dashboard

import (
	"context"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	total             int64
	active            int64
	inactive          int64
	pendingLeave      int64
	approvedThisMonth int64
	onLeaveToday      int64
	activeUsers       int64
	payroll           *PayrollSnapshot
	departments       []DepartmentHeadcount
	auditEvents       []AuditEvent
}

func (f *fakeRepository) CountEmployeesByStatus(_ context.Context) (int64, int64, int64, error) {
	return f.total, f.active, f.inactive, nil
}

func (f *fakeRepository) CountPendingLeaveRequests(_ context.Context) (int64, error) {
	return f.pendingLeave, nil
}

func (f *fakeRepository) CountApprovedLeaveInMonth(_ context.Context, _ time.Time) (int64, error) {
	return f.approvedThisMonth, nil
}

func (f *fakeRepository) CountEmployeesOnLeaveDate(_ context.Context, _ time.Time) (int64, error) {
	return f.onLeaveToday, nil
}

func (f *fakeRepository) GetCurrentPayrollSnapshot(_ context.Context) (*PayrollSnapshot, error) {
	return f.payroll, nil
}

func (f *fakeRepository) CountActiveUsers(_ context.Context) (int64, error) {
	return f.activeUsers, nil
}

func (f *fakeRepository) ListEmployeesPerDepartment(_ context.Context) ([]DepartmentHeadcount, error) {
	return f.departments, nil
}

func (f *fakeRepository) ListRecentAuditEvents(_ context.Context, _ int) ([]AuditEvent, error) {
	return f.auditEvents, nil
}

func TestGetDashboardSummaryForAdminIncludesAllData(t *testing.T) {
	repo := &fakeRepository{
		total:             20,
		active:            18,
		inactive:          2,
		pendingLeave:      4,
		approvedThisMonth: 9,
		onLeaveToday:      3,
		activeUsers:       6,
		payroll:           &PayrollSnapshot{Status: "Approved", Total: 32000},
		departments: []DepartmentHeadcount{
			{DepartmentName: "HR", Count: 5},
		},
		auditEvents: []AuditEvent{
			{ID: 1, Action: "user.login.success"},
		},
	}

	svc := NewService(repo)
	summary, err := svc.GetDashboardSummary(context.Background(), &models.Claims{UserID: 1, Role: "admin"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if summary.TotalEmployees != 20 || summary.PendingLeaveRequests != 4 || summary.EmployeesOnLeaveToday != 3 {
		t.Fatalf("unexpected summary core metrics: %+v", summary)
	}
	if summary.CurrentPayrollStatus == nil || *summary.CurrentPayrollStatus != "Approved" {
		t.Fatalf("expected payroll status for admin, got %+v", summary.CurrentPayrollStatus)
	}
	if summary.CurrentPayrollTotal == nil || *summary.CurrentPayrollTotal != 32000 {
		t.Fatalf("expected payroll total for admin, got %+v", summary.CurrentPayrollTotal)
	}
	if summary.ActiveUsers == nil || *summary.ActiveUsers != 6 {
		t.Fatalf("expected active users for admin, got %+v", summary.ActiveUsers)
	}
	if len(summary.RecentAuditEvents) != 1 {
		t.Fatalf("expected audit events for admin, got %d", len(summary.RecentAuditEvents))
	}
}

func TestGetDashboardSummaryForViewerHidesRestrictedData(t *testing.T) {
	repo := &fakeRepository{
		total:             10,
		active:            8,
		inactive:          2,
		pendingLeave:      1,
		approvedThisMonth: 2,
		onLeaveToday:      1,
		activeUsers:       5,
		payroll:           &PayrollSnapshot{Status: "Draft", Total: 1000},
	}

	svc := NewService(repo)
	summary, err := svc.GetDashboardSummary(context.Background(), &models.Claims{UserID: 2, Role: "viewer"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if summary.CurrentPayrollStatus != nil || summary.CurrentPayrollTotal != nil {
		t.Fatalf("expected viewer payroll fields hidden, got status=%v total=%v", summary.CurrentPayrollStatus, summary.CurrentPayrollTotal)
	}
	if summary.ActiveUsers != nil {
		t.Fatalf("expected viewer active users hidden, got %v", summary.ActiveUsers)
	}
	if len(summary.RecentAuditEvents) != 0 {
		t.Fatalf("expected viewer audit events hidden, got %d", len(summary.RecentAuditEvents))
	}
}
