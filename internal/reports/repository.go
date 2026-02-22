package reports

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	ListEmployeeReport(ctx context.Context, filter EmployeeListFilter, pager PagerInput) ([]EmployeeReportRow, int64, int, int, error)
	ListEmployeeReportForExport(ctx context.Context, filter EmployeeListFilter, maxRows int) ([]EmployeeReportRow, int64, error)

	ListLeaveRequestsReport(ctx context.Context, filter LeaveRequestsFilter, dateFrom, dateTo time.Time, pager PagerInput) ([]LeaveRequestsReportRow, int64, int, int, error)
	ListLeaveRequestsReportForExport(ctx context.Context, filter LeaveRequestsFilter, dateFrom, dateTo time.Time, maxRows int) ([]LeaveRequestsReportRow, int64, error)

	ListAttendanceSummaryReport(ctx context.Context, filter AttendanceSummaryFilter, dateFrom, dateTo time.Time, totalDays int, pager PagerInput) ([]AttendanceSummaryReportRow, int64, int, int, error)
	ListAttendanceSummaryReportForExport(ctx context.Context, filter AttendanceSummaryFilter, dateFrom, dateTo time.Time, totalDays int, maxRows int) ([]AttendanceSummaryReportRow, int64, error)

	ListPayrollBatchesReport(ctx context.Context, filter PayrollBatchesFilter, pager PagerInput) ([]PayrollBatchesReportRow, int64, int, int, error)
	ListPayrollBatchesReportForExport(ctx context.Context, filter PayrollBatchesFilter, maxRows int) ([]PayrollBatchesReportRow, int64, error)

	ListAuditLogReport(ctx context.Context, filter AuditLogFilter, dateFrom, dateTo time.Time, pager PagerInput) ([]AuditLogReportRow, int64, int, int, error)
	ListAuditLogReportForExport(ctx context.Context, filter AuditLogFilter, dateFrom, dateTo time.Time, maxRows int) ([]AuditLogReportRow, int64, error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func normalizePager(input PagerInput) (int, int) {
	page := input.Page
	if page <= 0 {
		page = 1
	}

	pageSize := input.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	return page, pageSize
}

func (r *SQLXRepository) ListEmployeeReport(ctx context.Context, filter EmployeeListFilter, pager PagerInput) ([]EmployeeReportRow, int64, int, int, error) {
	page, pageSize := normalizePager(pager)
	whereClause, args := buildEmployeeWhere(filter)

	countQuery := "SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON d.id = e.department_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count employee report rows: %w", err)
	}

	offset := (page - 1) * pageSize
	listArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(listArgs)+1)
	offsetPH := fmt.Sprintf("$%d", len(listArgs)+2)
	listArgs = append(listArgs, pageSize, offset)

	query := `
		SELECT
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			e.position,
			e.employment_status AS status,
			e.date_of_hire,
			COALESCE(e.phone, '') AS phone,
			COALESCE(e.email, '') AS email,
			CAST(e.base_salary_amount AS DOUBLE PRECISION) AS base_salary_amount
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id` + whereClause + `
		ORDER BY LOWER(e.last_name) ASC, LOWER(e.first_name) ASC, e.id ASC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	rows := make([]EmployeeReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, listArgs...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list employee report rows: %w", err)
	}

	return rows, total, page, pageSize, nil
}

func (r *SQLXRepository) ListEmployeeReportForExport(ctx context.Context, filter EmployeeListFilter, maxRows int) ([]EmployeeReportRow, int64, error) {
	whereClause, args := buildEmployeeWhere(filter)

	countQuery := "SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON d.id = e.department_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count employee report export rows: %w", err)
	}

	queryArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(queryArgs)+1)
	queryArgs = append(queryArgs, maxRows)

	query := `
		SELECT
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			e.position,
			e.employment_status AS status,
			e.date_of_hire,
			COALESCE(e.phone, '') AS phone,
			COALESCE(e.email, '') AS email,
			CAST(e.base_salary_amount AS DOUBLE PRECISION) AS base_salary_amount
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id` + whereClause + `
		ORDER BY LOWER(e.last_name) ASC, LOWER(e.first_name) ASC, e.id ASC
		LIMIT ` + limitPH

	rows := make([]EmployeeReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("export employee report rows: %w", err)
	}

	return rows, total, nil
}

func (r *SQLXRepository) ListLeaveRequestsReport(ctx context.Context, filter LeaveRequestsFilter, dateFrom, dateTo time.Time, pager PagerInput) ([]LeaveRequestsReportRow, int64, int, int, error) {
	page, pageSize := normalizePager(pager)
	whereClause, args := buildLeaveWhere(filter, dateFrom, dateTo)

	countQuery := "SELECT COUNT(*) FROM leave_requests lr INNER JOIN employees e ON e.id = lr.employee_id LEFT JOIN departments d ON d.id = e.department_id INNER JOIN leave_types lt ON lt.id = lr.leave_type_id LEFT JOIN users approver ON approver.id = lr.approved_by" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count leave report rows: %w", err)
	}

	offset := (page - 1) * pageSize
	listArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(listArgs)+1)
	offsetPH := fmt.Sprintf("$%d", len(listArgs)+2)
	listArgs = append(listArgs, pageSize, offset)

	query := `
		SELECT
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			lt.name AS leave_type,
			lr.start_date,
			lr.end_date,
			CAST(lr.working_days AS DOUBLE PRECISION) AS working_days,
			lr.status,
			approver.username AS approved_by,
			lr.approved_at
		FROM leave_requests lr
		INNER JOIN employees e ON e.id = lr.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		LEFT JOIN users approver ON approver.id = lr.approved_by` + whereClause + `
		ORDER BY lr.start_date DESC, lr.id DESC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	rows := make([]LeaveRequestsReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, listArgs...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list leave report rows: %w", err)
	}

	return rows, total, page, pageSize, nil
}

func (r *SQLXRepository) ListLeaveRequestsReportForExport(ctx context.Context, filter LeaveRequestsFilter, dateFrom, dateTo time.Time, maxRows int) ([]LeaveRequestsReportRow, int64, error) {
	whereClause, args := buildLeaveWhere(filter, dateFrom, dateTo)

	countQuery := "SELECT COUNT(*) FROM leave_requests lr INNER JOIN employees e ON e.id = lr.employee_id LEFT JOIN departments d ON d.id = e.department_id INNER JOIN leave_types lt ON lt.id = lr.leave_type_id LEFT JOIN users approver ON approver.id = lr.approved_by" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count leave report export rows: %w", err)
	}

	queryArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(queryArgs)+1)
	queryArgs = append(queryArgs, maxRows)

	query := `
		SELECT
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			lt.name AS leave_type,
			lr.start_date,
			lr.end_date,
			CAST(lr.working_days AS DOUBLE PRECISION) AS working_days,
			lr.status,
			approver.username AS approved_by,
			lr.approved_at
		FROM leave_requests lr
		INNER JOIN employees e ON e.id = lr.employee_id
		LEFT JOIN departments d ON d.id = e.department_id
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		LEFT JOIN users approver ON approver.id = lr.approved_by` + whereClause + `
		ORDER BY lr.start_date DESC, lr.id DESC
		LIMIT ` + limitPH

	rows := make([]LeaveRequestsReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("export leave report rows: %w", err)
	}

	return rows, total, nil
}

func (r *SQLXRepository) ListAttendanceSummaryReport(ctx context.Context, filter AttendanceSummaryFilter, dateFrom, dateTo time.Time, totalDays int, pager PagerInput) ([]AttendanceSummaryReportRow, int64, int, int, error) {
	page, pageSize := normalizePager(pager)
	whereClause, args := buildAttendanceEmployeeWhere(filter)

	countQuery := "SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON d.id = e.department_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count attendance summary rows: %w", err)
	}

	offset := (page - 1) * pageSize
	listArgs := append([]any{}, args...)
	fromPH := fmt.Sprintf("$%d", len(listArgs)+1)
	toPH := fmt.Sprintf("$%d", len(listArgs)+2)
	totalDaysPH := fmt.Sprintf("$%d", len(listArgs)+3)
	limitPH := fmt.Sprintf("$%d", len(listArgs)+4)
	offsetPH := fmt.Sprintf("$%d", len(listArgs)+5)
	listArgs = append(listArgs, dateFrom, dateTo, totalDays, pageSize, offset)

	query := `
		SELECT
			e.id AS employee_id,
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			COUNT(*) FILTER (WHERE ar.status = 'present')::INT AS present_count,
			COUNT(*) FILTER (WHERE ar.status = 'late')::INT AS late_count,
			COUNT(*) FILTER (WHERE ar.status = 'field')::INT AS field_count,
			COUNT(*) FILTER (WHERE ar.status = 'absent')::INT AS absent_count,
			COUNT(*) FILTER (WHERE ar.status = 'leave')::INT AS leave_count,
			GREATEST(` + totalDaysPH + ` - COUNT(ar.id), 0)::INT AS unmarked_count
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN attendance_records ar ON ar.employee_id = e.id
			AND ar.attendance_date >= ` + fromPH + `
			AND ar.attendance_date <= ` + toPH + whereClause + `
		GROUP BY e.id, employee_name, department_name
		ORDER BY LOWER(e.last_name) ASC, LOWER(e.first_name) ASC, e.id ASC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	rows := make([]AttendanceSummaryReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, listArgs...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list attendance summary rows: %w", err)
	}

	return rows, total, page, pageSize, nil
}

func (r *SQLXRepository) ListAttendanceSummaryReportForExport(ctx context.Context, filter AttendanceSummaryFilter, dateFrom, dateTo time.Time, totalDays int, maxRows int) ([]AttendanceSummaryReportRow, int64, error) {
	whereClause, args := buildAttendanceEmployeeWhere(filter)

	countQuery := "SELECT COUNT(*) FROM employees e LEFT JOIN departments d ON d.id = e.department_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count attendance summary export rows: %w", err)
	}

	queryArgs := append([]any{}, args...)
	fromPH := fmt.Sprintf("$%d", len(queryArgs)+1)
	toPH := fmt.Sprintf("$%d", len(queryArgs)+2)
	totalDaysPH := fmt.Sprintf("$%d", len(queryArgs)+3)
	limitPH := fmt.Sprintf("$%d", len(queryArgs)+4)
	queryArgs = append(queryArgs, dateFrom, dateTo, totalDays, maxRows)

	query := `
		SELECT
			e.id AS employee_id,
			TRIM(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) AS employee_name,
			COALESCE(d.name, '-') AS department_name,
			COUNT(*) FILTER (WHERE ar.status = 'present')::INT AS present_count,
			COUNT(*) FILTER (WHERE ar.status = 'late')::INT AS late_count,
			COUNT(*) FILTER (WHERE ar.status = 'field')::INT AS field_count,
			COUNT(*) FILTER (WHERE ar.status = 'absent')::INT AS absent_count,
			COUNT(*) FILTER (WHERE ar.status = 'leave')::INT AS leave_count,
			GREATEST(` + totalDaysPH + ` - COUNT(ar.id), 0)::INT AS unmarked_count
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN attendance_records ar ON ar.employee_id = e.id
			AND ar.attendance_date >= ` + fromPH + `
			AND ar.attendance_date <= ` + toPH + whereClause + `
		GROUP BY e.id, employee_name, department_name
		ORDER BY LOWER(e.last_name) ASC, LOWER(e.first_name) ASC, e.id ASC
		LIMIT ` + limitPH

	rows := make([]AttendanceSummaryReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("export attendance summary rows: %w", err)
	}

	return rows, total, nil
}

func (r *SQLXRepository) ListPayrollBatchesReport(ctx context.Context, filter PayrollBatchesFilter, pager PagerInput) ([]PayrollBatchesReportRow, int64, int, int, error) {
	page, pageSize := normalizePager(pager)
	whereClause, args := buildPayrollWhere(filter)

	countQuery := "SELECT COUNT(*) FROM payroll_batches pb" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count payroll report rows: %w", err)
	}

	offset := (page - 1) * pageSize
	listArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(listArgs)+1)
	offsetPH := fmt.Sprintf("$%d", len(listArgs)+2)
	listArgs = append(listArgs, pageSize, offset)

	query := `
		SELECT
			pb.month,
			pb.status,
			pb.created_at,
			pb.approved_at,
			pb.locked_at,
			COUNT(pe.id)::BIGINT AS entries_count,
			COALESCE(SUM(CAST(pe.net_pay AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION AS total_net_pay
		FROM payroll_batches pb
		LEFT JOIN payroll_entries pe ON pe.batch_id = pb.id` + whereClause + `
		GROUP BY pb.id, pb.month, pb.status, pb.created_at, pb.approved_at, pb.locked_at
		ORDER BY pb.month DESC, pb.id DESC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	rows := make([]PayrollBatchesReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, listArgs...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list payroll report rows: %w", err)
	}

	return rows, total, page, pageSize, nil
}

func (r *SQLXRepository) ListPayrollBatchesReportForExport(ctx context.Context, filter PayrollBatchesFilter, maxRows int) ([]PayrollBatchesReportRow, int64, error) {
	whereClause, args := buildPayrollWhere(filter)

	countQuery := "SELECT COUNT(*) FROM payroll_batches pb" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count payroll report export rows: %w", err)
	}

	queryArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(queryArgs)+1)
	queryArgs = append(queryArgs, maxRows)

	query := `
		SELECT
			pb.month,
			pb.status,
			pb.created_at,
			pb.approved_at,
			pb.locked_at,
			COUNT(pe.id)::BIGINT AS entries_count,
			COALESCE(SUM(CAST(pe.net_pay AS DOUBLE PRECISION)), 0)::DOUBLE PRECISION AS total_net_pay
		FROM payroll_batches pb
		LEFT JOIN payroll_entries pe ON pe.batch_id = pb.id` + whereClause + `
		GROUP BY pb.id, pb.month, pb.status, pb.created_at, pb.approved_at, pb.locked_at
		ORDER BY pb.month DESC, pb.id DESC
		LIMIT ` + limitPH

	rows := make([]PayrollBatchesReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("export payroll report rows: %w", err)
	}

	return rows, total, nil
}

func (r *SQLXRepository) ListAuditLogReport(ctx context.Context, filter AuditLogFilter, dateFrom, dateTo time.Time, pager PagerInput) ([]AuditLogReportRow, int64, int, int, error) {
	page, pageSize := normalizePager(pager)
	whereClause, args := buildAuditWhere(filter, dateFrom, dateTo)

	countQuery := "SELECT COUNT(*) FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_user_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count audit report rows: %w", err)
	}

	offset := (page - 1) * pageSize
	listArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(listArgs)+1)
	offsetPH := fmt.Sprintf("$%d", len(listArgs)+2)
	listArgs = append(listArgs, pageSize, offset)

	query := `
		SELECT
			al.created_at,
			COALESCE(u.username, '-') AS actor_username,
			al.action,
			COALESCE(al.entity_type, '') AS entity_type,
			al.entity_id,
			COALESCE(al.metadata::text, '{}') AS metadata_json
		FROM audit_logs al
		LEFT JOIN users u ON u.id = al.actor_user_id` + whereClause + `
		ORDER BY al.created_at DESC, al.id DESC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	rows := make([]AuditLogReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, listArgs...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list audit report rows: %w", err)
	}

	return rows, total, page, pageSize, nil
}

func (r *SQLXRepository) ListAuditLogReportForExport(ctx context.Context, filter AuditLogFilter, dateFrom, dateTo time.Time, maxRows int) ([]AuditLogReportRow, int64, error) {
	whereClause, args := buildAuditWhere(filter, dateFrom, dateTo)

	countQuery := "SELECT COUNT(*) FROM audit_logs al LEFT JOIN users u ON u.id = al.actor_user_id" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count audit report export rows: %w", err)
	}

	queryArgs := append([]any{}, args...)
	limitPH := fmt.Sprintf("$%d", len(queryArgs)+1)
	queryArgs = append(queryArgs, maxRows)

	query := `
		SELECT
			al.created_at,
			COALESCE(u.username, '-') AS actor_username,
			al.action,
			COALESCE(al.entity_type, '') AS entity_type,
			al.entity_id,
			COALESCE(al.metadata::text, '{}') AS metadata_json
		FROM audit_logs al
		LEFT JOIN users u ON u.id = al.actor_user_id` + whereClause + `
		ORDER BY al.created_at DESC, al.id DESC
		LIMIT ` + limitPH

	rows := make([]AuditLogReportRow, 0)
	if err := r.db.SelectContext(ctx, &rows, query, queryArgs...); err != nil {
		return nil, 0, fmt.Errorf("export audit report rows: %w", err)
	}

	return rows, total, nil
}

func buildEmployeeWhere(filter EmployeeListFilter) (string, []any) {
	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if filter.DepartmentID != nil && *filter.DepartmentID > 0 {
		where = append(where, "e.department_id = "+addArg(*filter.DepartmentID))
	}
	if status := strings.TrimSpace(filter.EmploymentStatus); status != "" {
		where = append(where, "e.employment_status = "+addArg(status))
	}
	if q := strings.TrimSpace(filter.Q); q != "" {
		like := "%" + strings.ToLower(q) + "%"
		ph := addArg(like)
		where = append(where, "(LOWER(CONCAT(e.first_name, ' ', e.last_name, ' ', COALESCE(e.other_name, ''))) LIKE "+ph+" OR LOWER(COALESCE(e.email, '')) LIKE "+ph+" OR LOWER(COALESCE(e.phone, '')) LIKE "+ph+")")
	}

	if len(where) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(where, " AND "), args
}

func buildLeaveWhere(filter LeaveRequestsFilter, dateFrom, dateTo time.Time) (string, []any) {
	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	fromPH := addArg(dateFrom)
	toPH := addArg(dateTo)
	where = append(where, "lr.start_date <= "+toPH+" AND lr.end_date >= "+fromPH)

	if filter.DepartmentID != nil && *filter.DepartmentID > 0 {
		where = append(where, "e.department_id = "+addArg(*filter.DepartmentID))
	}
	if filter.EmployeeID != nil && *filter.EmployeeID > 0 {
		where = append(where, "lr.employee_id = "+addArg(*filter.EmployeeID))
	}
	if filter.LeaveTypeID != nil && *filter.LeaveTypeID > 0 {
		where = append(where, "lr.leave_type_id = "+addArg(*filter.LeaveTypeID))
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		where = append(where, "lr.status = "+addArg(status))
	}

	if len(where) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(where, " AND "), args
}

func buildAttendanceEmployeeWhere(filter AttendanceSummaryFilter) (string, []any) {
	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if filter.DepartmentID != nil && *filter.DepartmentID > 0 {
		where = append(where, "e.department_id = "+addArg(*filter.DepartmentID))
	}
	if filter.EmployeeID != nil && *filter.EmployeeID > 0 {
		where = append(where, "e.id = "+addArg(*filter.EmployeeID))
	}

	if len(where) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(where, " AND "), args
}

func buildPayrollWhere(filter PayrollBatchesFilter) (string, []any) {
	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if monthFrom := strings.TrimSpace(filter.MonthFrom); monthFrom != "" {
		where = append(where, "pb.month >= "+addArg(monthFrom))
	}
	if monthTo := strings.TrimSpace(filter.MonthTo); monthTo != "" {
		where = append(where, "pb.month <= "+addArg(monthTo))
	}
	if status := strings.TrimSpace(filter.Status); status != "" {
		where = append(where, "pb.status = "+addArg(status))
	}

	if len(where) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(where, " AND "), args
}

func buildAuditWhere(filter AuditLogFilter, dateFrom, dateTo time.Time) (string, []any) {
	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	fromPH := addArg(dateFrom)
	toPH := addArg(dateTo)
	where = append(where, "al.created_at::date >= "+fromPH+" AND al.created_at::date <= "+toPH)

	if filter.ActorUserID != nil && *filter.ActorUserID > 0 {
		where = append(where, "al.actor_user_id = "+addArg(*filter.ActorUserID))
	}
	if action := strings.TrimSpace(filter.Action); action != "" {
		where = append(where, "al.action = "+addArg(action))
	}
	if entityType := strings.TrimSpace(filter.EntityType); entityType != "" {
		where = append(where, "al.entity_type = "+addArg(entityType))
	}

	if len(where) == 0 {
		return "", args
	}
	return " WHERE " + strings.Join(where, " AND "), args
}
