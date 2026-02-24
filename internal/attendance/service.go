package attendance

import (
	"context"
	"fmt"
	"strings"

	"hrpro/internal/audit"
	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type LeaveIntegration interface {
	CreateSingleDayLeaveFromAttendance(ctx context.Context, claims *models.Claims, employeeID int64, date string) (int64, error)
}

type LunchDefaultsProvider interface {
	GetLunchDefaults(ctx context.Context) (plateCostAmount int, staffContributionAmount int, err error)
}

type Service struct {
	repository            Repository
	leave                 LeaveIntegration
	lunchDefaultsProvider LunchDefaultsProvider
	audit                 audit.Recorder
}

func NewService(repository Repository, leave LeaveIntegration) *Service {
	return &Service{repository: repository, leave: leave, audit: audit.NewNoopRecorder()}
}

func (s *Service) SetAuditRecorder(recorder audit.Recorder) {
	if recorder == nil {
		s.audit = audit.NewNoopRecorder()
		return
	}
	s.audit = recorder
}

func (s *Service) SetLunchDefaultsProvider(provider LunchDefaultsProvider) {
	s.lunchDefaultsProvider = provider
}

func (s *Service) ListAttendanceByDate(ctx context.Context, claims *models.Claims, date string) ([]AttendanceRow, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	attendanceDate, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}

	role := middleware.NormalizeRole(claims.Role)
	if CanReadAll(role) {
		rows, err := s.repository.ListAttendanceRowsByDate(ctx, attendanceDate)
		if err != nil {
			return nil, err
		}
		for i := range rows {
			rows[i].CanPostToLeave = CanPostAbsentToLeave(role) && rows[i].Status == StatusAbsent
			rows[i].CanEdit = CanMarkAttendance(role) && (!rows[i].IsLocked || CanOverrideLocked(role))
		}
		return rows, nil
	}
	if role != "staff" {
		return nil, ErrForbidden
	}

	row, err := s.repository.GetAttendanceRowByDateAndEmployee(ctx, attendanceDate, claims.UserID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return []AttendanceRow{}, nil
	}
	row.CanPostToLeave = false
	row.CanEdit = false
	return []AttendanceRow{*row}, nil
}

func (s *Service) UpsertAttendance(ctx context.Context, claims *models.Claims, date string, employeeID int64, status string, reason *string) (*AttendanceRecord, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if employeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if !CanMarkAttendance(claims.Role) {
		return nil, ErrForbidden
	}

	attendanceDate, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}
	normalizedStatus, err := ValidateStatus(status)
	if err != nil {
		return nil, err
	}

	exists, err := s.repository.EmployeeExists(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	existing, err := s.repository.GetAttendanceRecordByDateAndEmployee(ctx, attendanceDate, employeeID)
	if err != nil {
		return nil, err
	}

	if existing == nil {
		created, err := s.repository.CreateAttendanceRecord(ctx, attendanceDate, employeeID, normalizedStatus, claims.UserID, normalizeOptional(reason))
		if err != nil {
			return nil, err
		}
		s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "attendance.mark", stringPtr("attendance_record"), &created.ID, map[string]any{
			"attendance_date": date,
			"employee_id":     employeeID,
			"status":          normalizedStatus,
		})
		return created, nil
	}

	if !CanEditLocked(existing.IsLocked, claims.Role) {
		return nil, ErrLocked
	}

	updated, err := s.repository.UpdateAttendanceRecordStatus(ctx, attendanceDate, employeeID, normalizedStatus, claims.UserID, normalizeOptional(reason))
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}

	if existing.IsLocked {
		s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "attendance.override", stringPtr("attendance_record"), &updated.ID, map[string]any{
			"attendance_date": date,
			"employee_id":     employeeID,
			"old_status":      existing.Status,
			"new_status":      normalizedStatus,
			"reason":          strings.TrimSpace(derefString(reason)),
		})
	} else {
		s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "attendance.mark", stringPtr("attendance_record"), &updated.ID, map[string]any{
			"attendance_date": date,
			"employee_id":     employeeID,
			"status":          normalizedStatus,
		})
	}

	return updated, nil
}

func (s *Service) GetMyAttendanceRange(ctx context.Context, claims *models.Claims, startDate, endDate string) ([]AttendanceRecord, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	start, err := ParseISODate(startDate)
	if err != nil {
		return nil, err
	}
	end, err := ParseISODate(endDate)
	if err != nil {
		return nil, err
	}
	if end.Before(start) {
		return nil, fmt.Errorf("%w: end date must be on or after start date", ErrValidation)
	}
	return s.repository.ListAttendanceRangeForEmployee(ctx, claims.UserID, start, end)
}

func (s *Service) GetLunchSummary(ctx context.Context, claims *models.Claims, date string) (*LunchSummary, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	role := middleware.NormalizeRole(claims.Role)
	if !(CanReadAll(role) || role == "staff") {
		return nil, ErrForbidden
	}
	attendanceDate, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}

	staffPresentCount, staffFieldCount, err := s.repository.CountAttendanceForLunch(ctx, attendanceDate)
	if err != nil {
		return nil, err
	}

	visitorsCount := 0
	plateCostAmount := 12000
	staffContributionAmount := 4000
	if s.lunchDefaultsProvider != nil {
		defaultPlateCost, defaultStaffContribution, defaultsErr := s.lunchDefaultsProvider.GetLunchDefaults(ctx)
		if defaultsErr == nil {
			plateCostAmount = defaultPlateCost
			staffContributionAmount = defaultStaffContribution
		}
	}

	lunchDaily, err := s.repository.GetLunchDaily(ctx, attendanceDate)
	if err != nil {
		return nil, err
	}
	if lunchDaily != nil {
		visitorsCount = lunchDaily.VisitorsCount
		plateCostAmount = lunchDaily.PlateCostAmount
		staffContributionAmount = lunchDaily.StaffContributionAmount
	}

	summary := CalculateLunchTotals(staffPresentCount, staffFieldCount, visitorsCount, plateCostAmount, staffContributionAmount)
	summary.AttendanceDate = attendanceDate.Format("2006-01-02")
	summary.CanEditVisitors = CanUpdateLunchVisitors(role)
	return &summary, nil
}

func (s *Service) UpsertLunchVisitors(ctx context.Context, claims *models.Claims, date string, visitorsCount int) (*LunchSummary, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if !CanUpdateLunchVisitors(claims.Role) {
		return nil, ErrForbidden
	}
	if visitorsCount < 0 {
		return nil, fmt.Errorf("%w: visitors count must be >= 0", ErrValidation)
	}
	attendanceDate, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}

	plateCostAmount := 12000
	staffContributionAmount := 4000
	if s.lunchDefaultsProvider != nil {
		defaultPlateCost, defaultStaffContribution, defaultsErr := s.lunchDefaultsProvider.GetLunchDefaults(ctx)
		if defaultsErr == nil {
			plateCostAmount = defaultPlateCost
			staffContributionAmount = defaultStaffContribution
		}
	}

	if _, err := s.repository.UpsertLunchVisitors(ctx, attendanceDate, visitorsCount, claims.UserID, plateCostAmount, staffContributionAmount); err != nil {
		return nil, err
	}
	result, err := s.GetLunchSummary(ctx, claims, date)
	if err != nil {
		return nil, err
	}

	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "lunch.update_visitors", stringPtr("lunch_catering_daily"), nil, map[string]any{
		"attendance_date": date,
		"visitors_count":  visitorsCount,
	})
	return result, nil
}

func (s *Service) PostAbsentToLeave(ctx context.Context, claims *models.Claims, date string, employeeID int64) (*PostAbsentToLeaveResult, error) {
	if claims == nil {
		return nil, ErrForbidden
	}
	if employeeID <= 0 {
		return nil, fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if !CanPostAbsentToLeave(claims.Role) {
		return nil, ErrForbidden
	}
	if s.leave == nil {
		return nil, fmt.Errorf("%w: leave module is unavailable", ErrLeaveIntegration)
	}

	attendanceDate, err := ParseISODate(date)
	if err != nil {
		return nil, err
	}

	exists, err := s.repository.EmployeeExists(ctx, employeeID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNotFound
	}

	record, err := s.repository.GetAttendanceRecordByDateAndEmployee(ctx, attendanceDate, employeeID)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, ErrNotFound
	}
	if record.Status != StatusAbsent {
		return nil, ErrNotAbsent
	}

	leaveID, leaveErr := s.leave.CreateSingleDayLeaveFromAttendance(ctx, claims, employeeID, date)
	if leaveErr != nil {
		s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "attendance.post_absent_to_leave", stringPtr("attendance_record"), &record.ID, map[string]any{
			"attendance_date": date,
			"employee_id":     employeeID,
			"result":          "failed",
			"error":           leaveErr.Error(),
		})
		return nil, fmt.Errorf("%w: %v", ErrLeaveIntegration, leaveErr)
	}

	reason := "post_absent_to_leave"
	updated, err := s.repository.UpdateAttendanceRecordStatus(ctx, attendanceDate, employeeID, StatusLeave, claims.UserID, &reason)
	if err != nil {
		return nil, err
	}
	if updated == nil {
		return nil, ErrNotFound
	}

	s.audit.RecordAuditEvent(ctx, claimsUserID(claims), "attendance.post_absent_to_leave", stringPtr("attendance_record"), &updated.ID, map[string]any{
		"attendance_date": date,
		"employee_id":     employeeID,
		"result":          "success",
		"leave_id":        leaveID,
	})

	return &PostAbsentToLeaveResult{Success: true, Message: "Absent posted to leave", LeaveID: &leaveID, Status: StatusLeave}, nil
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

func normalizeOptional(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func derefString(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}
