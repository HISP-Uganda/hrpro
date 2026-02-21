package leave

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	EmployeeExists(ctx context.Context, employeeID int64) (bool, error)
	ListLeaveTypes(ctx context.Context, activeOnly bool) ([]LeaveType, error)
	GetLeaveTypeByID(ctx context.Context, id int64) (*LeaveType, error)
	CreateLeaveType(ctx context.Context, input LeaveTypeUpsertInput) (*LeaveType, error)
	UpdateLeaveType(ctx context.Context, id int64, input LeaveTypeUpsertInput) (*LeaveType, error)
	SetLeaveTypeActive(ctx context.Context, id int64, active bool) (*LeaveType, error)

	ListLockedDates(ctx context.Context, year int) ([]LeaveLockedDate, error)
	ListLockedDatesInRange(ctx context.Context, startDate, endDate time.Time) ([]time.Time, error)
	LockDate(ctx context.Context, date time.Time, reason *string, createdBy int64) (*LeaveLockedDate, error)
	UnlockDate(ctx context.Context, date time.Time) (bool, error)

	GetEntitlement(ctx context.Context, employeeID int64, year int) (*LeaveEntitlement, error)
	UpsertEntitlement(ctx context.Context, input UpsertEntitlementInput) (*LeaveEntitlement, error)
	SumConsumedDays(ctx context.Context, employeeID int64, year int) (approved float64, pending float64, err error)

	ExistsApprovedOverlap(ctx context.Context, employeeID int64, startDate, endDate time.Time, excludeID *int64) (bool, error)
	CreateLeaveRequest(ctx context.Context, employeeID int64, input ApplyLeaveInput, workingDays float64) (*LeaveRequest, error)
	GetLeaveRequestByID(ctx context.Context, id int64) (*LeaveRequest, error)
	ListMyLeaveRequests(ctx context.Context, employeeID int64, filter ListLeaveRequestsFilter) ([]LeaveRequest, error)
	ListAllLeaveRequests(ctx context.Context, filter ListLeaveRequestsFilter) ([]LeaveRequest, error)
	UpdateLeaveRequestStatus(ctx context.Context, id int64, status string, approverID *int64, approvedAt *time.Time, reason *string) (*LeaveRequest, error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) EmployeeExists(ctx context.Context, employeeID int64) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM employees WHERE id = $1)`
	if err := r.db.GetContext(ctx, &exists, query, employeeID); err != nil {
		return false, fmt.Errorf("check employee exists: %w", err)
	}
	return exists, nil
}

func (r *SQLXRepository) ListLeaveTypes(ctx context.Context, activeOnly bool) ([]LeaveType, error) {
	query := `
		SELECT id, name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active, created_at, updated_at
		FROM leave_types
	`
	args := make([]any, 0)
	if activeOnly {
		query += " WHERE active = $1"
		args = append(args, true)
	}
	query += " ORDER BY name ASC"

	items := make([]LeaveType, 0)
	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		return nil, fmt.Errorf("list leave types: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) GetLeaveTypeByID(ctx context.Context, id int64) (*LeaveType, error) {
	query := `
		SELECT id, name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active, created_at, updated_at
		FROM leave_types
		WHERE id = $1
	`
	var item LeaveType
	if err := r.db.GetContext(ctx, &item, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get leave type by id: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) CreateLeaveType(ctx context.Context, input LeaveTypeUpsertInput) (*LeaveType, error) {
	query := `
		INSERT INTO leave_types (name, paid, counts_toward_entitlement, requires_attachment, requires_approval)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active, created_at, updated_at
	`
	var item LeaveType
	if err := r.db.GetContext(ctx, &item, query, input.Name, input.Paid, input.CountsTowardEntitlement, input.RequiresAttachment, input.RequiresApproval); err != nil {
		return nil, fmt.Errorf("create leave type: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) UpdateLeaveType(ctx context.Context, id int64, input LeaveTypeUpsertInput) (*LeaveType, error) {
	query := `
		UPDATE leave_types
		SET
			name = $2,
			paid = $3,
			counts_toward_entitlement = $4,
			requires_attachment = $5,
			requires_approval = $6,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active, created_at, updated_at
	`
	var item LeaveType
	if err := r.db.GetContext(ctx, &item, query, id, input.Name, input.Paid, input.CountsTowardEntitlement, input.RequiresAttachment, input.RequiresApproval); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("update leave type: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) SetLeaveTypeActive(ctx context.Context, id int64, active bool) (*LeaveType, error) {
	query := `
		UPDATE leave_types
		SET active = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active, created_at, updated_at
	`
	var item LeaveType
	if err := r.db.GetContext(ctx, &item, query, id, active); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("set leave type active: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) ListLockedDates(ctx context.Context, year int) ([]LeaveLockedDate, error) {
	query := `
		SELECT id, date, reason, created_by, created_at
		FROM leave_locked_dates
		WHERE EXTRACT(YEAR FROM date) = $1
		ORDER BY date ASC
	`
	items := make([]LeaveLockedDate, 0)
	if err := r.db.SelectContext(ctx, &items, query, year); err != nil {
		return nil, fmt.Errorf("list locked dates: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) ListLockedDatesInRange(ctx context.Context, startDate, endDate time.Time) ([]time.Time, error) {
	query := `
		SELECT date
		FROM leave_locked_dates
		WHERE date >= $1 AND date <= $2
	`
	items := make([]time.Time, 0)
	if err := r.db.SelectContext(ctx, &items, query, startDate, endDate); err != nil {
		return nil, fmt.Errorf("list locked dates in range: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) LockDate(ctx context.Context, date time.Time, reason *string, createdBy int64) (*LeaveLockedDate, error) {
	query := `
		INSERT INTO leave_locked_dates (date, reason, created_by)
		VALUES ($1, $2, $3)
		ON CONFLICT (date) DO UPDATE
		SET reason = EXCLUDED.reason, created_by = EXCLUDED.created_by
		RETURNING id, date, reason, created_by, created_at
	`
	var item LeaveLockedDate
	if err := r.db.GetContext(ctx, &item, query, date, reason, createdBy); err != nil {
		return nil, fmt.Errorf("lock date: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) UnlockDate(ctx context.Context, date time.Time) (bool, error) {
	query := `DELETE FROM leave_locked_dates WHERE date = $1`
	result, err := r.db.ExecContext(ctx, query, date)
	if err != nil {
		return false, fmt.Errorf("unlock date: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("unlock date rows affected: %w", err)
	}
	return rows > 0, nil
}

func (r *SQLXRepository) GetEntitlement(ctx context.Context, employeeID int64, year int) (*LeaveEntitlement, error) {
	query := `
		SELECT id, employee_id, year,
			CAST(total_days AS DOUBLE PRECISION) AS total_days,
			CAST(reserved_days AS DOUBLE PRECISION) AS reserved_days,
			created_at, updated_at
		FROM leave_entitlements
		WHERE employee_id = $1 AND year = $2
	`
	var item LeaveEntitlement
	if err := r.db.GetContext(ctx, &item, query, employeeID, year); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get entitlement: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) UpsertEntitlement(ctx context.Context, input UpsertEntitlementInput) (*LeaveEntitlement, error) {
	query := `
		INSERT INTO leave_entitlements (employee_id, year, total_days, reserved_days)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (employee_id, year) DO UPDATE
		SET total_days = EXCLUDED.total_days,
			reserved_days = EXCLUDED.reserved_days,
			updated_at = NOW()
		RETURNING id, employee_id, year,
			CAST(total_days AS DOUBLE PRECISION) AS total_days,
			CAST(reserved_days AS DOUBLE PRECISION) AS reserved_days,
			created_at, updated_at
	`
	var item LeaveEntitlement
	if err := r.db.GetContext(ctx, &item, query, input.EmployeeID, input.Year, input.TotalDays, input.ReservedDays); err != nil {
		return nil, fmt.Errorf("upsert entitlement: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) SumConsumedDays(ctx context.Context, employeeID int64, year int) (approved float64, pending float64, err error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN lr.status = 'Approved' THEN lr.working_days ELSE 0 END), 0) AS approved_days,
			COALESCE(SUM(CASE WHEN lr.status = 'Pending' THEN lr.working_days ELSE 0 END), 0) AS pending_days
		FROM leave_requests lr
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		WHERE lr.employee_id = $1
			AND EXTRACT(YEAR FROM lr.start_date) = $2
			AND lt.counts_toward_entitlement = TRUE
	`
	row := struct {
		Approved float64 `db:"approved_days"`
		Pending  float64 `db:"pending_days"`
	}{}
	if err := r.db.GetContext(ctx, &row, query, employeeID, year); err != nil {
		return 0, 0, fmt.Errorf("sum consumed leave days: %w", err)
	}
	return row.Approved, row.Pending, nil
}

func (r *SQLXRepository) ExistsApprovedOverlap(ctx context.Context, employeeID int64, startDate, endDate time.Time, excludeID *int64) (bool, error) {
	args := []any{employeeID, startDate, endDate}
	query := `
		SELECT EXISTS(
			SELECT 1
			FROM leave_requests
			WHERE employee_id = $1
				AND status = 'Approved'
				AND start_date <= $3
				AND end_date >= $2
	`
	if excludeID != nil {
		args = append(args, *excludeID)
		query += fmt.Sprintf(" AND id <> $%d", len(args))
	}
	query += `
		)
	`
	var exists bool
	if err := r.db.GetContext(ctx, &exists, query, args...); err != nil {
		return false, fmt.Errorf("exists approved overlap: %w", err)
	}
	return exists, nil
}

func (r *SQLXRepository) CreateLeaveRequest(ctx context.Context, employeeID int64, input ApplyLeaveInput, workingDays float64) (*LeaveRequest, error) {
	query := `
		INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, working_days, status, reason)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	var id int64
	if err := r.db.GetContext(ctx, &id, query, employeeID, input.LeaveTypeID, input.StartDate, input.EndDate, workingDays, StatusPending, input.Reason); err != nil {
		return nil, fmt.Errorf("create leave request: %w", err)
	}

	return r.GetLeaveRequestByID(ctx, id)
}

func (r *SQLXRepository) GetLeaveRequestByID(ctx context.Context, id int64) (*LeaveRequest, error) {
	query := `
		SELECT lr.id,
			lr.employee_id,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			d.name AS department_name,
			lr.leave_type_id,
			lt.name AS leave_type_name,
			lr.start_date,
			lr.end_date,
			CAST(lr.working_days AS DOUBLE PRECISION) AS working_days,
			lr.status,
			lr.reason,
			lr.approved_by,
			lr.approved_at,
			lr.created_at,
			lr.updated_at
		FROM leave_requests lr
		INNER JOIN employees e ON e.id = lr.employee_id
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		LEFT JOIN departments d ON d.id = e.department_id
		WHERE lr.id = $1
	`
	var item LeaveRequest
	if err := r.db.GetContext(ctx, &item, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get leave request by id: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) ListMyLeaveRequests(ctx context.Context, employeeID int64, filter ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	base := `
		SELECT lr.id,
			lr.employee_id,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			d.name AS department_name,
			lr.leave_type_id,
			lt.name AS leave_type_name,
			lr.start_date,
			lr.end_date,
			CAST(lr.working_days AS DOUBLE PRECISION) AS working_days,
			lr.status,
			lr.reason,
			lr.approved_by,
			lr.approved_at,
			lr.created_at,
			lr.updated_at
		FROM leave_requests lr
		INNER JOIN employees e ON e.id = lr.employee_id
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		LEFT JOIN departments d ON d.id = e.department_id
	`

	items, err := r.listRequestsWithFilters(ctx, base, []string{"lr.employee_id = $1"}, []any{employeeID}, filter)
	if err != nil {
		return nil, fmt.Errorf("list my leave requests: %w", err)
	}

	return items, nil
}

func (r *SQLXRepository) ListAllLeaveRequests(ctx context.Context, filter ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	base := `
		SELECT lr.id,
			lr.employee_id,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			d.name AS department_name,
			lr.leave_type_id,
			lt.name AS leave_type_name,
			lr.start_date,
			lr.end_date,
			CAST(lr.working_days AS DOUBLE PRECISION) AS working_days,
			lr.status,
			lr.reason,
			lr.approved_by,
			lr.approved_at,
			lr.created_at,
			lr.updated_at
		FROM leave_requests lr
		INNER JOIN employees e ON e.id = lr.employee_id
		INNER JOIN leave_types lt ON lt.id = lr.leave_type_id
		LEFT JOIN departments d ON d.id = e.department_id
	`

	items, err := r.listRequestsWithFilters(ctx, base, []string{}, []any{}, filter)
	if err != nil {
		return nil, fmt.Errorf("list all leave requests: %w", err)
	}

	return items, nil
}

func (r *SQLXRepository) UpdateLeaveRequestStatus(ctx context.Context, id int64, status string, approverID *int64, approvedAt *time.Time, reason *string) (*LeaveRequest, error) {
	query := `
		UPDATE leave_requests
		SET status = $2,
			approved_by = $3,
			approved_at = $4,
			reason = COALESCE($5, reason),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id
	`
	var updatedID int64
	if err := r.db.GetContext(ctx, &updatedID, query, id, status, approverID, approvedAt, reason); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("update leave request status: %w", err)
	}

	return r.GetLeaveRequestByID(ctx, updatedID)
}

func (r *SQLXRepository) listRequestsWithFilters(ctx context.Context, base string, where []string, args []any, filter ListLeaveRequestsFilter) ([]LeaveRequest, error) {
	addArg := func(value any) string {
		args = append(args, value)
		return fmt.Sprintf("$%d", len(args))
	}

	if status := strings.TrimSpace(filter.Status); status != "" {
		where = append(where, "lr.status = "+addArg(status))
	}

	if dateFrom := strings.TrimSpace(filter.DateFrom); dateFrom != "" {
		where = append(where, "lr.start_date >= "+addArg(dateFrom))
	}

	if dateTo := strings.TrimSpace(filter.DateTo); dateTo != "" {
		where = append(where, "lr.end_date <= "+addArg(dateTo))
	}

	if employee := strings.TrimSpace(filter.Employee); employee != "" {
		where = append(where, "LOWER(TRIM(e.first_name || ' ' || e.last_name)) LIKE "+addArg("%"+strings.ToLower(employee)+"%"))
	}

	if leaveType := strings.TrimSpace(filter.LeaveType); leaveType != "" {
		where = append(where, "LOWER(lt.name) LIKE "+addArg("%"+strings.ToLower(leaveType)+"%"))
	}

	if dept := strings.TrimSpace(filter.Dept); dept != "" {
		where = append(where, "LOWER(COALESCE(d.name, '')) LIKE "+addArg("%"+strings.ToLower(dept)+"%"))
	}

	query := base
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY lr.created_at DESC"

	items := make([]LeaveRequest, 0)
	if err := r.db.SelectContext(ctx, &items, query, args...); err != nil {
		return nil, err
	}

	return items, nil
}
