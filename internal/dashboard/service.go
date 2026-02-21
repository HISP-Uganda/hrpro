package dashboard

import (
	"context"
	"fmt"
	"time"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

type Service struct {
	repository Repository
	now        func() time.Time
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository, now: time.Now}
}

func (s *Service) GetDashboardSummary(ctx context.Context, claims *models.Claims) (*SummaryDTO, error) {
	if claims == nil {
		return nil, fmt.Errorf("claims are required")
	}

	summary := &SummaryDTO{
		EmployeesPerDepartment: make([]DepartmentHeadcount, 0),
		RecentAuditEvents:      make([]AuditEvent, 0),
	}

	normalizedRole := middleware.NormalizeRole(claims.Role)
	now := s.now().UTC()

	total, active, inactive, err := s.repository.CountEmployeesByStatus(ctx)
	if err != nil {
		return nil, err
	}
	summary.TotalEmployees = total
	summary.ActiveEmployees = active
	summary.InactiveEmployees = inactive

	summary.PendingLeaveRequests, err = s.repository.CountPendingLeaveRequests(ctx)
	if err != nil {
		return nil, err
	}

	summary.ApprovedLeaveThisMonth, err = s.repository.CountApprovedLeaveInMonth(ctx, now)
	if err != nil {
		return nil, err
	}

	summary.EmployeesOnLeaveToday, err = s.repository.CountEmployeesOnLeaveDate(ctx, now)
	if err != nil {
		return nil, err
	}

	summary.EmployeesPerDepartment, err = s.repository.ListEmployeesPerDepartment(ctx)
	if err != nil {
		return nil, err
	}

	if normalizedRole == "admin" || normalizedRole == "hr_officer" || normalizedRole == "finance_officer" {
		payrollSnapshot, payrollErr := s.repository.GetCurrentPayrollSnapshot(ctx)
		if payrollErr != nil {
			return nil, payrollErr
		}
		if payrollSnapshot != nil {
			status := payrollSnapshot.Status
			totalValue := payrollSnapshot.Total
			summary.CurrentPayrollStatus = &status
			summary.CurrentPayrollTotal = &totalValue
		}
	}

	if normalizedRole == "admin" {
		activeUsers, usersErr := s.repository.CountActiveUsers(ctx)
		if usersErr != nil {
			return nil, usersErr
		}
		summary.ActiveUsers = &activeUsers

		summary.RecentAuditEvents, err = s.repository.ListRecentAuditEvents(ctx, 10)
		if err != nil {
			return nil, err
		}
	}

	if normalizedRole == "viewer" {
		summary.CurrentPayrollStatus = nil
		summary.CurrentPayrollTotal = nil
		summary.ActiveUsers = nil
		summary.RecentAuditEvents = make([]AuditEvent, 0)
	}

	return summary, nil
}
