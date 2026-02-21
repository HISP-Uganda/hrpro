package leave

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	employeeExists bool
	leaveType      *LeaveType
	lockedDates    []time.Time
	overlap        bool
	entitlement    *LeaveEntitlement
	approvedDays   float64
	pendingDays    float64
	requestByID    map[int64]*LeaveRequest
	createdRequest *LeaveRequest
}

func (f *fakeRepository) EmployeeExists(_ context.Context, _ int64) (bool, error) {
	return f.employeeExists, nil
}

func (f *fakeRepository) ListLeaveTypes(_ context.Context, _ bool) ([]LeaveType, error) {
	return []LeaveType{}, nil
}

func (f *fakeRepository) GetLeaveTypeByID(_ context.Context, _ int64) (*LeaveType, error) {
	return f.leaveType, nil
}

func (f *fakeRepository) CreateLeaveType(_ context.Context, input LeaveTypeUpsertInput) (*LeaveType, error) {
	return &LeaveType{ID: 1, Name: input.Name}, nil
}

func (f *fakeRepository) UpdateLeaveType(_ context.Context, id int64, input LeaveTypeUpsertInput) (*LeaveType, error) {
	return &LeaveType{ID: id, Name: input.Name}, nil
}

func (f *fakeRepository) SetLeaveTypeActive(_ context.Context, id int64, active bool) (*LeaveType, error) {
	return &LeaveType{ID: id, Active: active}, nil
}

func (f *fakeRepository) ListLockedDates(_ context.Context, _ int) ([]LeaveLockedDate, error) {
	return []LeaveLockedDate{}, nil
}

func (f *fakeRepository) ListLockedDatesInRange(_ context.Context, _, _ time.Time) ([]time.Time, error) {
	return f.lockedDates, nil
}

func (f *fakeRepository) LockDate(_ context.Context, date time.Time, reason *string, createdBy int64) (*LeaveLockedDate, error) {
	return &LeaveLockedDate{ID: 1, Date: date, Reason: reason, CreatedBy: &createdBy}, nil
}

func (f *fakeRepository) UnlockDate(_ context.Context, _ time.Time) (bool, error) {
	return true, nil
}

func (f *fakeRepository) GetEntitlement(_ context.Context, _ int64, _ int) (*LeaveEntitlement, error) {
	return f.entitlement, nil
}

func (f *fakeRepository) UpsertEntitlement(_ context.Context, input UpsertEntitlementInput) (*LeaveEntitlement, error) {
	return &LeaveEntitlement{
		ID:           1,
		EmployeeID:   input.EmployeeID,
		Year:         input.Year,
		TotalDays:    input.TotalDays,
		ReservedDays: input.ReservedDays,
	}, nil
}

func (f *fakeRepository) SumConsumedDays(_ context.Context, _ int64, _ int) (approved float64, pending float64, err error) {
	return f.approvedDays, f.pendingDays, nil
}

func (f *fakeRepository) ExistsApprovedOverlap(_ context.Context, _ int64, _, _ time.Time, _ *int64) (bool, error) {
	return f.overlap, nil
}

func (f *fakeRepository) CreateLeaveRequest(_ context.Context, employeeID int64, input ApplyLeaveInput, workingDays float64) (*LeaveRequest, error) {
	startDate, _ := time.Parse("2006-01-02", input.StartDate)
	endDate, _ := time.Parse("2006-01-02", input.EndDate)
	request := &LeaveRequest{
		ID:          100,
		EmployeeID:  employeeID,
		LeaveTypeID: input.LeaveTypeID,
		StartDate:   startDate,
		EndDate:     endDate,
		WorkingDays: workingDays,
		Status:      StatusPending,
	}
	f.createdRequest = request
	return request, nil
}

func (f *fakeRepository) GetLeaveRequestByID(_ context.Context, id int64) (*LeaveRequest, error) {
	return f.requestByID[id], nil
}

func (f *fakeRepository) ListMyLeaveRequests(_ context.Context, _ int64, _ ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	return []LeaveRequest{}, nil
}

func (f *fakeRepository) ListAllLeaveRequests(_ context.Context, _ ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	return []LeaveRequest{}, nil
}

func (f *fakeRepository) UpdateLeaveRequestStatus(_ context.Context, id int64, status string, approverID *int64, approvedAt *time.Time, reason *string) (*LeaveRequest, error) {
	item := f.requestByID[id]
	item.Status = status
	item.ApprovedBy = approverID
	item.ApprovedAt = approvedAt
	item.Reason = reason
	return item, nil
}

func TestApplyLeaveRejectsLockedDates(t *testing.T) {
	repo := &fakeRepository{
		employeeExists: true,
		leaveType:      &LeaveType{ID: 1, Active: true, CountsTowardEntitlement: true},
		entitlement:    &LeaveEntitlement{EmployeeID: 10, Year: 2026, TotalDays: 20, ReservedDays: 0},
		lockedDates:    []time.Time{time.Date(2026, time.February, 23, 0, 0, 0, 0, time.UTC)},
	}
	service := NewService(repo)

	_, err := service.ApplyLeave(context.Background(), &models.Claims{UserID: 10, Role: "Viewer"}, ApplyLeaveInput{
		LeaveTypeID: 1,
		StartDate:   "2026-02-23",
		EndDate:     "2026-02-24",
	})

	if !errors.Is(err, ErrLockedDateConflict) {
		t.Fatalf("expected locked date conflict, got %v", err)
	}
}

func TestGetLeaveBalanceIncludesPendingAndApproved(t *testing.T) {
	repo := &fakeRepository{
		employeeExists: true,
		entitlement:    &LeaveEntitlement{EmployeeID: 9, Year: 2026, TotalDays: 25, ReservedDays: 3},
		approvedDays:   5,
		pendingDays:    4,
	}
	service := NewService(repo)

	balance, err := service.GetLeaveBalance(context.Background(), 9, 2026)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if balance.AvailableDays != 13 {
		t.Fatalf("expected available days to be 13, got %.2f", balance.AvailableDays)
	}
}

func TestApplyLeaveRejectsOverlapWithApprovedLeave(t *testing.T) {
	repo := &fakeRepository{
		employeeExists: true,
		leaveType:      &LeaveType{ID: 1, Active: true, CountsTowardEntitlement: true},
		entitlement:    &LeaveEntitlement{EmployeeID: 10, Year: 2026, TotalDays: 20, ReservedDays: 0},
		overlap:        true,
	}
	service := NewService(repo)

	_, err := service.ApplyLeave(context.Background(), &models.Claims{UserID: 10, Role: "Viewer"}, ApplyLeaveInput{
		LeaveTypeID: 1,
		StartDate:   "2026-02-23",
		EndDate:     "2026-02-24",
	})

	if !errors.Is(err, ErrOverlapApproved) {
		t.Fatalf("expected overlap error, got %v", err)
	}
}

func TestStatusTransitionsAndRBAC(t *testing.T) {
	repo := &fakeRepository{
		requestByID: map[int64]*LeaveRequest{
			1: {
				ID:         1,
				EmployeeID: 10,
				Status:     StatusPending,
			},
			2: {
				ID:         2,
				EmployeeID: 10,
				Status:     StatusApproved,
			},
		},
	}
	service := NewService(repo)

	_, err := service.CancelLeave(context.Background(), &models.Claims{UserID: 10, Role: "Viewer"}, 1)
	if err != nil {
		t.Fatalf("expected self cancel pending to pass, got %v", err)
	}

	_, err = service.CancelLeave(context.Background(), &models.Claims{UserID: 10, Role: "Viewer"}, 2)
	if !errors.Is(err, ErrInvalidTransition) {
		t.Fatalf("expected invalid transition for self cancel approved, got %v", err)
	}

	_, err = service.CancelLeave(context.Background(), &models.Claims{UserID: 77, Role: "HR Officer"}, 2)
	if err != nil {
		t.Fatalf("expected HR cancel approved to pass, got %v", err)
	}

	if CanTransitionStatus(StatusPending, StatusApproved, false, true) {
		t.Fatalf("expected non-admin/non-hr approve transition to be rejected")
	}
}
