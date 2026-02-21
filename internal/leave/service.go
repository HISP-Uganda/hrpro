package leave

import (
	"context"
	"fmt"
	"strings"
	"time"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListLeaveTypes(ctx context.Context, activeOnly bool) ([]LeaveType, error) {
	return s.repository.ListLeaveTypes(ctx, activeOnly)
}

func (s *Service) CreateLeaveType(ctx context.Context, input LeaveTypeUpsertInput) (*LeaveType, error) {
	normalized, err := normalizeLeaveTypeInput(input)
	if err != nil {
		return nil, err
	}
	return s.repository.CreateLeaveType(ctx, normalized)
}

func (s *Service) UpdateLeaveType(ctx context.Context, id int64, input LeaveTypeUpsertInput) (*LeaveType, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: leave type id must be positive", ErrValidation)
	}
	normalized, err := normalizeLeaveTypeInput(input)
	if err != nil {
		return nil, err
	}
	item, err := s.repository.UpdateLeaveType(ctx, id, normalized)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNotFound
	}
	return item, nil
}

func (s *Service) SetLeaveTypeActive(ctx context.Context, id int64, active bool) (*LeaveType, error) {
	if id <= 0 {
		return nil, fmt.Errorf("%w: leave type id must be positive", ErrValidation)
	}
	item, err := s.repository.SetLeaveTypeActive(ctx, id, active)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNotFound
	}
	return item, nil
}

func (s *Service) ListLockedDates(ctx context.Context, year int) ([]LeaveLockedDate, error) {
	if year <= 0 {
		year = time.Now().Year()
	}
	return s.repository.ListLockedDates(ctx, year)
}

func (s *Service) LockDate(ctx context.Context, claims *models.Claims, date, reason string) (*LeaveLockedDate, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	parsed, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}
	return s.repository.LockDate(ctx, parsed, normalizeOptional(reason), claims.UserID)
}

func (s *Service) UnlockDate(ctx context.Context, date string) error {
	parsed, err := ParseISODate(date)
	if err != nil {
		return err
	}
	ok, err := s.repository.UnlockDate(ctx, parsed)
	if err != nil {
		return err
	}
	if !ok {
		return ErrNotFound
	}
	return nil
}

func (s *Service) GetMyLeaveBalance(ctx context.Context, claims *models.Claims, year int) (*LeaveBalance, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	return s.GetLeaveBalance(ctx, claims.UserID, year)
}

func (s *Service) GetLeaveBalance(ctx context.Context, employeeID int64, year int) (*LeaveBalance, error) {
	if employeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if year <= 0 {
		year = time.Now().Year()
	}

	exists, err := s.repository.EmployeeExists(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	entitlement, err := s.repository.GetEntitlement(ctx, employeeID, year)
	if err != nil {
		return nil, err
	}
	approvedDays, pendingDays, err := s.repository.SumConsumedDays(ctx, employeeID, year)
	if err != nil {
		return nil, err
	}

	totalDays := 0.0
	reservedDays := 0.0
	if entitlement != nil {
		totalDays = entitlement.TotalDays
		reservedDays = entitlement.ReservedDays
	}

	available := totalDays - reservedDays - approvedDays - pendingDays
	if available < 0 {
		available = 0
	}

	return &LeaveBalance{
		EmployeeID:    employeeID,
		Year:          year,
		TotalDays:     totalDays,
		ReservedDays:  reservedDays,
		ApprovedDays:  approvedDays,
		PendingDays:   pendingDays,
		AvailableDays: available,
	}, nil
}

func (s *Service) UpsertEntitlement(ctx context.Context, input UpsertEntitlementInput) (*LeaveEntitlement, error) {
	if input.EmployeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if input.Year <= 0 {
		return nil, fmt.Errorf("%w: year is required", ErrValidation)
	}
	if input.TotalDays < 0 || input.ReservedDays < 0 {
		return nil, fmt.Errorf("%w: total/reserved days must be >= 0", ErrValidation)
	}
	if input.ReservedDays > input.TotalDays {
		return nil, fmt.Errorf("%w: reserved days cannot exceed total days", ErrValidation)
	}

	exists, err := s.repository.EmployeeExists(ctx, input.EmployeeID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	return s.repository.UpsertEntitlement(ctx, input)
}

func (s *Service) ApplyLeave(ctx context.Context, claims *models.Claims, input ApplyLeaveInput) (*LeaveRequest, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if input.LeaveTypeID <= 0 {
		return nil, fmt.Errorf("%w: leave type id must be positive", ErrValidation)
	}

	startDate, err := ParseISODate(input.StartDate)
	if err != nil {
		return nil, err
	}
	endDate, err := ParseISODate(input.EndDate)
	if err != nil {
		return nil, err
	}

	if startDate.Year() != endDate.Year() {
		return nil, fmt.Errorf("%w: leave request must be in a single calendar year", ErrValidation)
	}

	workingDates, workingDays, err := CalculateWorkingDays(startDate, endDate)
	if err != nil {
		return nil, err
	}

	employeeID := claims.UserID
	exists, err := s.repository.EmployeeExists(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	leaveType, err := s.repository.GetLeaveTypeByID(ctx, input.LeaveTypeID)
	if err != nil {
		return nil, err
	}
	if leaveType == nil || !leaveType.Active {
		return nil, ErrValidation
	}

	lockedDates, err := s.repository.ListLockedDatesInRange(ctx, startDate, endDate)
	if err != nil {
		return nil, err
	}
	if hasLockedWorkingDate(workingDates, lockedDates) {
		return nil, ErrLockedDateConflict
	}

	overlap, err := s.repository.ExistsApprovedOverlap(ctx, employeeID, startDate, endDate, nil)
	if err != nil {
		return nil, err
	}
	if overlap {
		return nil, ErrOverlapApproved
	}

	if leaveType.CountsTowardEntitlement {
		balance, err := s.GetLeaveBalance(ctx, employeeID, startDate.Year())
		if err != nil {
			return nil, err
		}
		if workingDays > balance.AvailableDays {
			return nil, ErrInsufficientBalance
		}
	}

	requestInput := input
	requestInput.StartDate = startDate.Format("2006-01-02")
	requestInput.EndDate = endDate.Format("2006-01-02")
	requestInput.Reason = normalizeOptionalPtr(input.Reason)

	return s.repository.CreateLeaveRequest(ctx, employeeID, requestInput, workingDays)
}

func (s *Service) ListMyLeaveRequests(ctx context.Context, claims *models.Claims, filter ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	return s.repository.ListMyLeaveRequests(ctx, claims.UserID, filter)
}

func (s *Service) ListAllLeaveRequests(ctx context.Context, filter ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	return s.repository.ListAllLeaveRequests(ctx, filter)
}

func (s *Service) ApproveLeave(ctx context.Context, claims *models.Claims, requestID int64) (*LeaveRequest, error) {
	if claims == nil || requestID <= 0 {
		return nil, ErrValidation
	}
	item, err := s.repository.GetLeaveRequestByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNotFound
	}

	if !CanTransitionStatus(item.Status, StatusApproved, true, false) {
		return nil, ErrInvalidTransition
	}

	now := time.Now().UTC()
	return s.repository.UpdateLeaveRequestStatus(ctx, requestID, StatusApproved, &claims.UserID, &now, nil)
}

func (s *Service) RejectLeave(ctx context.Context, claims *models.Claims, requestID int64, reason *string) (*LeaveRequest, error) {
	if claims == nil || requestID <= 0 {
		return nil, ErrValidation
	}
	item, err := s.repository.GetLeaveRequestByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNotFound
	}

	if !CanTransitionStatus(item.Status, StatusRejected, true, false) {
		return nil, ErrInvalidTransition
	}

	normalizedReason := normalizeOptionalPtr(reason)
	if normalizedReason == nil {
		empty := "Rejected"
		normalizedReason = &empty
	}
	return s.repository.UpdateLeaveRequestStatus(ctx, requestID, StatusRejected, &claims.UserID, nil, normalizedReason)
}

func (s *Service) CancelLeave(ctx context.Context, claims *models.Claims, requestID int64) (*LeaveRequest, error) {
	if claims == nil || requestID <= 0 {
		return nil, ErrValidation
	}
	item, err := s.repository.GetLeaveRequestByID(ctx, requestID)
	if err != nil {
		return nil, err
	}
	if item == nil {
		return nil, ErrNotFound
	}

	isAdminOrHR := hasAdminOrHRRole(claims.Role)
	isSelf := item.EmployeeID == claims.UserID
	if !CanTransitionStatus(item.Status, StatusCancelled, isAdminOrHR, isSelf) {
		return nil, ErrInvalidTransition
	}

	var approverID *int64
	var approvedAt *time.Time
	if isAdminOrHR {
		approverID = &claims.UserID
		now := time.Now().UTC()
		approvedAt = &now
	}

	return s.repository.UpdateLeaveRequestStatus(ctx, requestID, StatusCancelled, approverID, approvedAt, nil)
}

func normalizeLeaveTypeInput(input LeaveTypeUpsertInput) (LeaveTypeUpsertInput, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return LeaveTypeUpsertInput{}, fmt.Errorf("%w: leave type name is required", ErrValidation)
	}

	return LeaveTypeUpsertInput{
		Name:                    name,
		Paid:                    input.Paid,
		CountsTowardEntitlement: input.CountsTowardEntitlement,
		RequiresAttachment:      input.RequiresAttachment,
		RequiresApproval:        input.RequiresApproval,
	}, nil
}

func normalizeOptional(value string) *string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func normalizeOptionalPtr(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func hasLockedWorkingDate(workingDates []time.Time, lockedDates []time.Time) bool {
	set := make(map[string]struct{}, len(workingDates))
	for _, day := range workingDates {
		set[day.Format("2006-01-02")] = struct{}{}
	}
	for _, locked := range lockedDates {
		if _, ok := set[locked.Format("2006-01-02")]; ok {
			return true
		}
	}
	return false
}

func hasAdminOrHRRole(role string) bool {
	normalized := middleware.NormalizeRole(role)
	return normalized == "admin" || normalized == "hr_officer"
}
