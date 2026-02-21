package attendance

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	employeeExists      bool
	record              *AttendanceRecord
	updatedRecord       *AttendanceRecord
	rows                []AttendanceRow
	lunchPresentCount   int
	lunchFieldCount     int
	lunchDaily          *LunchDaily
	upsertVisitorsCount int
}

func (f *fakeRepository) EmployeeExists(_ context.Context, _ int64) (bool, error) {
	return f.employeeExists, nil
}

func (f *fakeRepository) ListAttendanceRowsByDate(_ context.Context, _ time.Time) ([]AttendanceRow, error) {
	return f.rows, nil
}

func (f *fakeRepository) GetAttendanceRowByDateAndEmployee(_ context.Context, _ time.Time, _ int64) (*AttendanceRow, error) {
	if len(f.rows) == 0 {
		return nil, nil
	}
	row := f.rows[0]
	return &row, nil
}

func (f *fakeRepository) GetAttendanceRecordByDateAndEmployee(_ context.Context, _ time.Time, _ int64) (*AttendanceRecord, error) {
	return f.record, nil
}

func (f *fakeRepository) CreateAttendanceRecord(_ context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error) {
	item := &AttendanceRecord{ID: 1, AttendanceDate: attendanceDate, EmployeeID: employeeID, Status: status, MarkedByUserID: markedByUserID, IsLocked: true, LockReason: lockReason}
	f.record = item
	return item, nil
}

func (f *fakeRepository) UpdateAttendanceRecordStatus(_ context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error) {
	if f.record == nil {
		return nil, nil
	}
	f.record.AttendanceDate = attendanceDate
	f.record.EmployeeID = employeeID
	f.record.Status = status
	f.record.MarkedByUserID = markedByUserID
	f.record.LockReason = lockReason
	f.updatedRecord = f.record
	return f.record, nil
}

func (f *fakeRepository) ListAttendanceRangeForEmployee(_ context.Context, _ int64, _, _ time.Time) ([]AttendanceRecord, error) {
	return []AttendanceRecord{}, nil
}

func (f *fakeRepository) GetLunchDaily(_ context.Context, _ time.Time) (*LunchDaily, error) {
	return f.lunchDaily, nil
}

func (f *fakeRepository) UpsertLunchVisitors(_ context.Context, _ time.Time, visitorsCount int, _ int64) (*LunchDaily, error) {
	f.upsertVisitorsCount = visitorsCount
	if f.lunchDaily == nil {
		f.lunchDaily = &LunchDaily{VisitorsCount: visitorsCount, PlateCostAmount: 12000, StaffContributionAmount: 4000}
	} else {
		f.lunchDaily.VisitorsCount = visitorsCount
	}
	return f.lunchDaily, nil
}

func (f *fakeRepository) CountAttendanceForLunch(_ context.Context, _ time.Time) (int, int, error) {
	return f.lunchPresentCount, f.lunchFieldCount, nil
}

type fakeLeaveIntegration struct {
	called    bool
	resultID  int64
	resultErr error
}

func (f *fakeLeaveIntegration) CreateSingleDayLeaveFromAttendance(_ context.Context, _ *models.Claims, _ int64, _ string) (int64, error) {
	f.called = true
	return f.resultID, f.resultErr
}

func TestRBACNonAdminCannotMarkOthers(t *testing.T) {
	repo := &fakeRepository{employeeExists: true}
	service := NewService(repo, &fakeLeaveIntegration{})

	_, err := service.UpsertAttendance(context.Background(), &models.Claims{UserID: 11, Role: "viewer"}, "2026-02-21", 22, StatusPresent, nil)
	if !errors.Is(err, ErrForbidden) {
		t.Fatalf("expected forbidden error, got %v", err)
	}
}

func TestPostAbsentToLeaveRejectsIfNotAbsent(t *testing.T) {
	repo := &fakeRepository{
		employeeExists: true,
		record:         &AttendanceRecord{ID: 55, EmployeeID: 9, Status: StatusPresent, IsLocked: true},
	}
	leave := &fakeLeaveIntegration{resultID: 101}
	service := NewService(repo, leave)

	_, err := service.PostAbsentToLeave(context.Background(), &models.Claims{UserID: 1, Role: "HR Officer"}, "2026-02-21", 9)
	if !errors.Is(err, ErrNotAbsent) {
		t.Fatalf("expected ErrNotAbsent, got %v", err)
	}
	if leave.called {
		t.Fatal("expected leave integration not to be called")
	}
}

func TestPostAbsentToLeaveFailureDoesNotChangeAttendance(t *testing.T) {
	repo := &fakeRepository{
		employeeExists: true,
		record:         &AttendanceRecord{ID: 55, EmployeeID: 9, Status: StatusAbsent, IsLocked: true},
	}
	leave := &fakeLeaveIntegration{resultErr: errors.New("insufficient balance")}
	service := NewService(repo, leave)

	_, err := service.PostAbsentToLeave(context.Background(), &models.Claims{UserID: 1, Role: "Admin"}, "2026-02-21", 9)
	if !errors.Is(err, ErrLeaveIntegration) {
		t.Fatalf("expected ErrLeaveIntegration, got %v", err)
	}
	if repo.record.Status != StatusAbsent {
		t.Fatalf("expected attendance to remain absent, got %s", repo.record.Status)
	}
}

func TestLunchCalculations(t *testing.T) {
	repo := &fakeRepository{
		lunchPresentCount: 8,
		lunchFieldCount:   3,
		lunchDaily:        &LunchDaily{VisitorsCount: 2, PlateCostAmount: 12000, StaffContributionAmount: 4000},
	}
	service := NewService(repo, &fakeLeaveIntegration{})

	summary, err := service.GetLunchSummary(context.Background(), &models.Claims{UserID: 1, Role: "Viewer"}, "2026-02-21")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if summary.TotalPlates != 10 {
		t.Fatalf("expected total plates 10, got %d", summary.TotalPlates)
	}
	if summary.TotalCostAmount != 120000 {
		t.Fatalf("expected total cost 120000, got %d", summary.TotalCostAmount)
	}
	if summary.StaffContributionTotal != 32000 {
		t.Fatalf("expected staff contribution total 32000, got %d", summary.StaffContributionTotal)
	}
	if summary.OrganizationBalance != 88000 {
		t.Fatalf("expected organization balance 88000, got %d", summary.OrganizationBalance)
	}
}
