package reports

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"time"

	"hrpro/internal/middleware"
	"hrpro/internal/models"
)

const (
	maxExportRows = 50000
)

var monthPattern = regexp.MustCompile(`^\d{4}-\d{2}$`)

type Service struct {
	repository Repository
}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func (s *Service) ListEmployeeReport(ctx context.Context, claims *models.Claims, filter EmployeeListFilter, pager PagerInput) (*EmployeeReportListResult, error) {
	if !canAccessEmployeeReport(claims) {
		return nil, ErrAccessDenied
	}
	if err := validateEmployeeFilter(filter); err != nil {
		return nil, err
	}

	rows, total, page, pageSize, err := s.repository.ListEmployeeReport(ctx, filter, pager)
	if err != nil {
		return nil, err
	}
	if !canViewSalary(claims) {
		redactEmployeeSalary(rows)
	}

	return &EmployeeReportListResult{Rows: rows, Pager: Pager{Page: page, PageSize: pageSize, TotalCount: total}}, nil
}

func (s *Service) ExportEmployeeReportCSV(ctx context.Context, claims *models.Claims, filter EmployeeListFilter) (*CSVExport, error) {
	if !canAccessEmployeeReport(claims) {
		return nil, ErrAccessDenied
	}
	if err := validateEmployeeFilter(filter); err != nil {
		return nil, err
	}

	rows, total, err := s.repository.ListEmployeeReportForExport(ctx, filter, maxExportRows)
	if err != nil {
		return nil, err
	}
	if total > maxExportRows {
		return nil, fmt.Errorf("%w: reduce result set below %d rows", ErrExportLimitExceeded, maxExportRows)
	}
	if !canViewSalary(claims) {
		redactEmployeeSalary(rows)
	}

	csvData, err := exportEmployeeCSV(rows)
	if err != nil {
		return nil, err
	}

	return &CSVExport{
		Filename: fmt.Sprintf("employee-list-%s.csv", time.Now().Format("2006-01-02")),
		Data:     csvData,
		MimeType: "text/csv;charset=utf-8",
	}, nil
}

func (s *Service) ListLeaveRequestsReport(ctx context.Context, claims *models.Claims, filter LeaveRequestsFilter, pager PagerInput) (*LeaveRequestsReportListResult, error) {
	if !canAccessLeaveReport(claims) {
		return nil, ErrAccessDenied
	}

	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateLeaveFilter(filter); err != nil {
		return nil, err
	}

	rows, total, page, pageSize, err := s.repository.ListLeaveRequestsReport(ctx, filter, dateFrom, dateTo, pager)
	if err != nil {
		return nil, err
	}

	return &LeaveRequestsReportListResult{Rows: rows, Pager: Pager{Page: page, PageSize: pageSize, TotalCount: total}}, nil
}

func (s *Service) ExportLeaveRequestsReportCSV(ctx context.Context, claims *models.Claims, filter LeaveRequestsFilter) (*CSVExport, error) {
	if !canAccessLeaveReport(claims) {
		return nil, ErrAccessDenied
	}
	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateLeaveFilter(filter); err != nil {
		return nil, err
	}

	rows, total, err := s.repository.ListLeaveRequestsReportForExport(ctx, filter, dateFrom, dateTo, maxExportRows)
	if err != nil {
		return nil, err
	}
	if total > maxExportRows {
		return nil, fmt.Errorf("%w: reduce result set below %d rows", ErrExportLimitExceeded, maxExportRows)
	}

	csvData, err := exportLeaveCSV(rows)
	if err != nil {
		return nil, err
	}

	filename := fmt.Sprintf("leave-requests-%s_to_%s.csv", dateFrom.Format("2006-01-02"), dateTo.Format("2006-01-02"))
	return &CSVExport{Filename: filename, Data: csvData, MimeType: "text/csv;charset=utf-8"}, nil
}

func (s *Service) ListAttendanceSummaryReport(ctx context.Context, claims *models.Claims, filter AttendanceSummaryFilter, pager PagerInput) (*AttendanceSummaryReportListResult, error) {
	if !canAccessAttendanceReport(claims) {
		return nil, ErrAccessDenied
	}

	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateAttendanceFilter(filter); err != nil {
		return nil, err
	}

	totalDays := int(dateTo.Sub(dateFrom).Hours()/24) + 1
	rows, total, page, pageSize, err := s.repository.ListAttendanceSummaryReport(ctx, filter, dateFrom, dateTo, totalDays, pager)
	if err != nil {
		return nil, err
	}

	return &AttendanceSummaryReportListResult{Rows: rows, Pager: Pager{Page: page, PageSize: pageSize, TotalCount: total}}, nil
}

func (s *Service) ExportAttendanceSummaryReportCSV(ctx context.Context, claims *models.Claims, filter AttendanceSummaryFilter) (*CSVExport, error) {
	if !canAccessAttendanceReport(claims) {
		return nil, ErrAccessDenied
	}
	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateAttendanceFilter(filter); err != nil {
		return nil, err
	}

	totalDays := int(dateTo.Sub(dateFrom).Hours()/24) + 1
	rows, total, err := s.repository.ListAttendanceSummaryReportForExport(ctx, filter, dateFrom, dateTo, totalDays, maxExportRows)
	if err != nil {
		return nil, err
	}
	if total > maxExportRows {
		return nil, fmt.Errorf("%w: reduce result set below %d rows", ErrExportLimitExceeded, maxExportRows)
	}

	csvData, err := exportAttendanceSummaryCSV(rows)
	if err != nil {
		return nil, err
	}

	filename := fmt.Sprintf("attendance-summary-%s_to_%s.csv", dateFrom.Format("2006-01-02"), dateTo.Format("2006-01-02"))
	return &CSVExport{Filename: filename, Data: csvData, MimeType: "text/csv;charset=utf-8"}, nil
}

func (s *Service) ListPayrollBatchesReport(ctx context.Context, claims *models.Claims, filter PayrollBatchesFilter, pager PagerInput) (*PayrollBatchesReportListResult, error) {
	if !canAccessPayrollReport(claims) {
		return nil, ErrAccessDenied
	}
	if err := validatePayrollFilter(filter); err != nil {
		return nil, err
	}

	rows, total, page, pageSize, err := s.repository.ListPayrollBatchesReport(ctx, filter, pager)
	if err != nil {
		return nil, err
	}

	return &PayrollBatchesReportListResult{Rows: rows, Pager: Pager{Page: page, PageSize: pageSize, TotalCount: total}}, nil
}

func (s *Service) ExportPayrollBatchesReportCSV(ctx context.Context, claims *models.Claims, filter PayrollBatchesFilter) (*CSVExport, error) {
	if !canAccessPayrollReport(claims) {
		return nil, ErrAccessDenied
	}
	if err := validatePayrollFilter(filter); err != nil {
		return nil, err
	}

	rows, total, err := s.repository.ListPayrollBatchesReportForExport(ctx, filter, maxExportRows)
	if err != nil {
		return nil, err
	}
	if total > maxExportRows {
		return nil, fmt.Errorf("%w: reduce result set below %d rows", ErrExportLimitExceeded, maxExportRows)
	}

	csvData, err := exportPayrollBatchesCSV(rows)
	if err != nil {
		return nil, err
	}

	return &CSVExport{
		Filename: fmt.Sprintf("payroll-batches-%s.csv", time.Now().Format("2006-01-02")),
		Data:     csvData,
		MimeType: "text/csv;charset=utf-8",
	}, nil
}

func (s *Service) ListAuditLogReport(ctx context.Context, claims *models.Claims, filter AuditLogFilter, pager PagerInput) (*AuditLogReportListResult, error) {
	if !canAccessAuditReport(claims) {
		return nil, ErrAccessDenied
	}

	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateAuditFilter(filter); err != nil {
		return nil, err
	}

	rows, total, page, pageSize, err := s.repository.ListAuditLogReport(ctx, filter, dateFrom, dateTo, pager)
	if err != nil {
		return nil, err
	}

	return &AuditLogReportListResult{Rows: rows, Pager: Pager{Page: page, PageSize: pageSize, TotalCount: total}}, nil
}

func (s *Service) ExportAuditLogReportCSV(ctx context.Context, claims *models.Claims, filter AuditLogFilter) (*CSVExport, error) {
	if !canAccessAuditReport(claims) {
		return nil, ErrAccessDenied
	}

	dateFrom, dateTo, err := validateDateRange(filter.DateFrom, filter.DateTo)
	if err != nil {
		return nil, err
	}
	if err := validateAuditFilter(filter); err != nil {
		return nil, err
	}

	rows, total, err := s.repository.ListAuditLogReportForExport(ctx, filter, dateFrom, dateTo, maxExportRows)
	if err != nil {
		return nil, err
	}
	if total > maxExportRows {
		return nil, fmt.Errorf("%w: reduce result set below %d rows", ErrExportLimitExceeded, maxExportRows)
	}

	csvData, err := exportAuditCSV(rows)
	if err != nil {
		return nil, err
	}

	filename := fmt.Sprintf("audit-log-%s_to_%s.csv", dateFrom.Format("2006-01-02"), dateTo.Format("2006-01-02"))
	return &CSVExport{Filename: filename, Data: csvData, MimeType: "text/csv;charset=utf-8"}, nil
}

func validateEmployeeFilter(filter EmployeeListFilter) error {
	if filter.DepartmentID != nil && *filter.DepartmentID <= 0 {
		return fmt.Errorf("%w: department id must be positive", ErrValidation)
	}
	if len(strings.TrimSpace(filter.Q)) > 200 {
		return fmt.Errorf("%w: search text is too long", ErrValidation)
	}
	if status := strings.TrimSpace(filter.EmploymentStatus); status != "" {
		switch status {
		case "Active", "Inactive", "active", "inactive":
		default:
			return fmt.Errorf("%w: invalid employment status", ErrValidation)
		}
	}
	return nil
}

func validateLeaveFilter(filter LeaveRequestsFilter) error {
	if filter.DepartmentID != nil && *filter.DepartmentID <= 0 {
		return fmt.Errorf("%w: department id must be positive", ErrValidation)
	}
	if filter.EmployeeID != nil && *filter.EmployeeID <= 0 {
		return fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	if filter.LeaveTypeID != nil && *filter.LeaveTypeID <= 0 {
		return fmt.Errorf("%w: leave type id must be positive", ErrValidation)
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		switch status {
		case "Pending", "Approved", "Rejected", "Cancelled":
		default:
			return fmt.Errorf("%w: invalid leave status", ErrValidation)
		}
	}
	return nil
}

func validateAttendanceFilter(filter AttendanceSummaryFilter) error {
	if filter.DepartmentID != nil && *filter.DepartmentID <= 0 {
		return fmt.Errorf("%w: department id must be positive", ErrValidation)
	}
	if filter.EmployeeID != nil && *filter.EmployeeID <= 0 {
		return fmt.Errorf("%w: employee id must be positive", ErrValidation)
	}
	return nil
}

func validatePayrollFilter(filter PayrollBatchesFilter) error {
	monthFrom := strings.TrimSpace(filter.MonthFrom)
	monthTo := strings.TrimSpace(filter.MonthTo)

	if monthFrom != "" && !monthPattern.MatchString(monthFrom) {
		return fmt.Errorf("%w: monthFrom must be YYYY-MM", ErrValidation)
	}
	if monthTo != "" && !monthPattern.MatchString(monthTo) {
		return fmt.Errorf("%w: monthTo must be YYYY-MM", ErrValidation)
	}
	if monthFrom != "" && monthTo != "" && monthFrom > monthTo {
		return fmt.Errorf("%w: monthFrom must be before or equal to monthTo", ErrValidation)
	}

	if status := strings.TrimSpace(filter.Status); status != "" {
		switch status {
		case "Draft", "Approved", "Locked":
		default:
			return fmt.Errorf("%w: invalid payroll status", ErrValidation)
		}
	}

	return nil
}

func validateAuditFilter(filter AuditLogFilter) error {
	if filter.ActorUserID != nil && *filter.ActorUserID <= 0 {
		return fmt.Errorf("%w: actor user id must be positive", ErrValidation)
	}
	if len(strings.TrimSpace(filter.Action)) > 150 {
		return fmt.Errorf("%w: action is too long", ErrValidation)
	}
	if len(strings.TrimSpace(filter.EntityType)) > 150 {
		return fmt.Errorf("%w: entity type is too long", ErrValidation)
	}
	return nil
}

func validateDateRange(dateFromRaw, dateToRaw string) (time.Time, time.Time, error) {
	dateFromRaw = strings.TrimSpace(dateFromRaw)
	dateToRaw = strings.TrimSpace(dateToRaw)
	if dateFromRaw == "" || dateToRaw == "" {
		return time.Time{}, time.Time{}, fmt.Errorf("%w: date range is required", ErrValidation)
	}

	dateFrom, err := time.Parse("2006-01-02", dateFromRaw)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("%w: dateFrom must be YYYY-MM-DD", ErrValidation)
	}
	dateTo, err := time.Parse("2006-01-02", dateToRaw)
	if err != nil {
		return time.Time{}, time.Time{}, fmt.Errorf("%w: dateTo must be YYYY-MM-DD", ErrValidation)
	}
	if dateFrom.After(dateTo) {
		return time.Time{}, time.Time{}, fmt.Errorf("%w: dateFrom must be before or equal to dateTo", ErrValidation)
	}

	return dateFrom, dateTo, nil
}

func canViewSalary(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	role := middleware.NormalizeRole(claims.Role)
	return role == "admin" || role == "finance_officer"
}

func canAccessEmployeeReport(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	role := middleware.NormalizeRole(claims.Role)
	return role == "admin" || role == "hr_officer" || role == "finance_officer" || role == "viewer"
}

func canAccessLeaveReport(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	role := middleware.NormalizeRole(claims.Role)
	return role == "admin" || role == "hr_officer" || role == "viewer"
}

func canAccessAttendanceReport(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	role := middleware.NormalizeRole(claims.Role)
	return role == "admin" || role == "hr_officer" || role == "viewer"
}

func canAccessPayrollReport(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	role := middleware.NormalizeRole(claims.Role)
	return role == "admin" || role == "finance_officer"
}

func canAccessAuditReport(claims *models.Claims) bool {
	if claims == nil {
		return false
	}
	return middleware.NormalizeRole(claims.Role) == "admin"
}

func redactEmployeeSalary(rows []EmployeeReportRow) {
	for i := range rows {
		rows[i].BaseSalaryAmount = nil
	}
}
