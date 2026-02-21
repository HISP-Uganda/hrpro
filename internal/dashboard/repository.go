package dashboard

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	CountEmployeesByStatus(ctx context.Context) (total int64, active int64, inactive int64, err error)
	CountPendingLeaveRequests(ctx context.Context) (int64, error)
	CountApprovedLeaveInMonth(ctx context.Context, now time.Time) (int64, error)
	CountEmployeesOnLeaveDate(ctx context.Context, day time.Time) (int64, error)
	GetCurrentPayrollSnapshot(ctx context.Context) (*PayrollSnapshot, error)
	CountActiveUsers(ctx context.Context) (int64, error)
	ListEmployeesPerDepartment(ctx context.Context) ([]DepartmentHeadcount, error)
	ListRecentAuditEvents(ctx context.Context, limit int) ([]AuditEvent, error)
}

type PayrollSnapshot struct {
	Status string  `db:"status"`
	Total  float64 `db:"total"`
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) CountEmployeesByStatus(ctx context.Context) (int64, int64, int64, error) {
	query := `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE LOWER(employment_status) = 'active') AS active,
			COUNT(*) FILTER (WHERE LOWER(employment_status) <> 'active') AS inactive
		FROM employees
	`

	var result struct {
		Total    int64 `db:"total"`
		Active   int64 `db:"active"`
		Inactive int64 `db:"inactive"`
	}
	if err := r.db.GetContext(ctx, &result, query); err != nil {
		return 0, 0, 0, fmt.Errorf("count employees by status: %w", err)
	}

	return result.Total, result.Active, result.Inactive, nil
}

func (r *SQLXRepository) CountPendingLeaveRequests(ctx context.Context) (int64, error) {
	query := `SELECT COUNT(*) FROM leave_requests WHERE status = $1`
	var count int64
	if err := r.db.GetContext(ctx, &count, query, "Pending"); err != nil {
		return 0, fmt.Errorf("count pending leave requests: %w", err)
	}
	return count, nil
}

func (r *SQLXRepository) CountApprovedLeaveInMonth(ctx context.Context, now time.Time) (int64, error) {
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	nextMonthStart := monthStart.AddDate(0, 1, 0)

	query := `
		SELECT COUNT(*)
		FROM leave_requests
		WHERE status = $1
		  AND approved_at >= $2
		  AND approved_at < $3
	`
	var count int64
	if err := r.db.GetContext(ctx, &count, query, "Approved", monthStart, nextMonthStart); err != nil {
		return 0, fmt.Errorf("count approved leave this month: %w", err)
	}
	return count, nil
}

func (r *SQLXRepository) CountEmployeesOnLeaveDate(ctx context.Context, day time.Time) (int64, error) {
	query := `
		SELECT COUNT(DISTINCT employee_id)
		FROM leave_requests
		WHERE status = $1
		  AND start_date <= $2::date
		  AND end_date >= $2::date
	`
	var count int64
	if err := r.db.GetContext(ctx, &count, query, "Approved", day); err != nil {
		return 0, fmt.Errorf("count employees on leave today: %w", err)
	}
	return count, nil
}

func (r *SQLXRepository) GetCurrentPayrollSnapshot(ctx context.Context) (*PayrollSnapshot, error) {
	query := `
		SELECT pb.status, COALESCE(SUM(CAST(pe.net_pay AS DOUBLE PRECISION)), 0) AS total
		FROM payroll_batches pb
		LEFT JOIN payroll_entries pe ON pe.batch_id = pb.id
		GROUP BY pb.id, pb.status, pb.month
		ORDER BY pb.month DESC
		LIMIT 1
	`
	var snapshot PayrollSnapshot
	if err := r.db.GetContext(ctx, &snapshot, query); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get current payroll snapshot: %w", err)
	}
	return &snapshot, nil
}

func (r *SQLXRepository) CountActiveUsers(ctx context.Context) (int64, error) {
	query := `SELECT COUNT(*) FROM users WHERE is_active = TRUE`
	var count int64
	if err := r.db.GetContext(ctx, &count, query); err != nil {
		return 0, fmt.Errorf("count active users: %w", err)
	}
	return count, nil
}

func (r *SQLXRepository) ListEmployeesPerDepartment(ctx context.Context) ([]DepartmentHeadcount, error) {
	query := `
		SELECT
			COALESCE(d.name, 'Unassigned') AS department_name,
			COUNT(e.id) AS count
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		GROUP BY COALESCE(d.name, 'Unassigned')
		ORDER BY COUNT(e.id) DESC, COALESCE(d.name, 'Unassigned') ASC
	`
	items := make([]DepartmentHeadcount, 0)
	if err := r.db.SelectContext(ctx, &items, query); err != nil {
		return nil, fmt.Errorf("list employees per department: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) ListRecentAuditEvents(ctx context.Context, limit int) ([]AuditEvent, error) {
	if limit <= 0 {
		limit = 10
	}

	query := `
		SELECT
			al.id,
			al.actor_user_id,
			u.username AS actor_username,
			al.action,
			al.entity_type,
			al.entity_id,
			al.created_at
		FROM audit_logs al
		LEFT JOIN users u ON u.id = al.actor_user_id
		ORDER BY al.created_at DESC
		LIMIT $1
	`
	items := make([]AuditEvent, 0)
	if err := r.db.SelectContext(ctx, &items, query, limit); err != nil {
		return nil, fmt.Errorf("list recent audit events: %w", err)
	}
	return items, nil
}
