package attendance

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	EmployeeExists(ctx context.Context, employeeID int64) (bool, error)
	ListAttendanceRowsByDate(ctx context.Context, attendanceDate time.Time) ([]AttendanceRow, error)
	GetAttendanceRowByDateAndEmployee(ctx context.Context, attendanceDate time.Time, employeeID int64) (*AttendanceRow, error)
	GetAttendanceRecordByDateAndEmployee(ctx context.Context, attendanceDate time.Time, employeeID int64) (*AttendanceRecord, error)
	CreateAttendanceRecord(ctx context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error)
	UpdateAttendanceRecordStatus(ctx context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error)
	ListAttendanceRangeForEmployee(ctx context.Context, employeeID int64, startDate, endDate time.Time) ([]AttendanceRecord, error)
	GetLunchDaily(ctx context.Context, attendanceDate time.Time) (*LunchDaily, error)
	UpsertLunchVisitors(ctx context.Context, attendanceDate time.Time, visitorsCount int, updatedByUserID int64) (*LunchDaily, error)
	CountAttendanceForLunch(ctx context.Context, attendanceDate time.Time) (staffPresentCount int, staffFieldCount int, err error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) EmployeeExists(ctx context.Context, employeeID int64) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM employees WHERE id = $1)`
	var exists bool
	if err := r.db.GetContext(ctx, &exists, query, employeeID); err != nil {
		return false, fmt.Errorf("check employee exists: %w", err)
	}
	return exists, nil
}

func (r *SQLXRepository) ListAttendanceRowsByDate(ctx context.Context, attendanceDate time.Time) ([]AttendanceRow, error) {
	query := `
		SELECT
			e.id AS employee_id,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			d.name AS department_name,
			ar.id AS attendance_id,
			COALESCE(ar.status, 'unmarked') AS status,
			COALESCE(ar.is_locked, FALSE) AS is_locked,
			ar.marked_by_user_id,
			ar.marked_at
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN attendance_records ar
			ON ar.employee_id = e.id
			AND ar.attendance_date = $1
		ORDER BY e.first_name ASC, e.last_name ASC
	`
	items := make([]AttendanceRow, 0)
	if err := r.db.SelectContext(ctx, &items, query, attendanceDate); err != nil {
		return nil, fmt.Errorf("list attendance rows by date: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) GetAttendanceRowByDateAndEmployee(ctx context.Context, attendanceDate time.Time, employeeID int64) (*AttendanceRow, error) {
	query := `
		SELECT
			e.id AS employee_id,
			TRIM(e.first_name || ' ' || e.last_name) AS employee_name,
			d.name AS department_name,
			ar.id AS attendance_id,
			COALESCE(ar.status, 'unmarked') AS status,
			COALESCE(ar.is_locked, FALSE) AS is_locked,
			ar.marked_by_user_id,
			ar.marked_at
		FROM employees e
		LEFT JOIN departments d ON d.id = e.department_id
		LEFT JOIN attendance_records ar
			ON ar.employee_id = e.id
			AND ar.attendance_date = $1
		WHERE e.id = $2
	`
	var item AttendanceRow
	if err := r.db.GetContext(ctx, &item, query, attendanceDate, employeeID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get attendance row by date and employee: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) GetAttendanceRecordByDateAndEmployee(ctx context.Context, attendanceDate time.Time, employeeID int64) (*AttendanceRecord, error) {
	query := `
		SELECT
			id,
			attendance_date,
			employee_id,
			status,
			marked_by_user_id,
			marked_at,
			is_locked,
			lock_reason,
			created_at,
			updated_at
		FROM attendance_records
		WHERE attendance_date = $1
		AND employee_id = $2
	`
	var item AttendanceRecord
	if err := r.db.GetContext(ctx, &item, query, attendanceDate, employeeID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get attendance record by date and employee: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) CreateAttendanceRecord(ctx context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error) {
	query := `
		INSERT INTO attendance_records (attendance_date, employee_id, status, marked_by_user_id, is_locked, lock_reason)
		VALUES ($1, $2, $3, $4, TRUE, $5)
		RETURNING
			id,
			attendance_date,
			employee_id,
			status,
			marked_by_user_id,
			marked_at,
			is_locked,
			lock_reason,
			created_at,
			updated_at
	`
	var item AttendanceRecord
	if err := r.db.GetContext(ctx, &item, query, attendanceDate, employeeID, status, markedByUserID, lockReason); err != nil {
		return nil, fmt.Errorf("create attendance record: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) UpdateAttendanceRecordStatus(ctx context.Context, attendanceDate time.Time, employeeID int64, status string, markedByUserID int64, lockReason *string) (*AttendanceRecord, error) {
	query := `
		UPDATE attendance_records
		SET
			status = $3,
			marked_by_user_id = $4,
			marked_at = NOW(),
			is_locked = TRUE,
			lock_reason = COALESCE($5, lock_reason),
			updated_at = NOW()
		WHERE attendance_date = $1
		AND employee_id = $2
		RETURNING
			id,
			attendance_date,
			employee_id,
			status,
			marked_by_user_id,
			marked_at,
			is_locked,
			lock_reason,
			created_at,
			updated_at
	`
	var item AttendanceRecord
	if err := r.db.GetContext(ctx, &item, query, attendanceDate, employeeID, status, markedByUserID, lockReason); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("update attendance record status: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) ListAttendanceRangeForEmployee(ctx context.Context, employeeID int64, startDate, endDate time.Time) ([]AttendanceRecord, error) {
	query := `
		SELECT
			id,
			attendance_date,
			employee_id,
			status,
			marked_by_user_id,
			marked_at,
			is_locked,
			lock_reason,
			created_at,
			updated_at
		FROM attendance_records
		WHERE employee_id = $1
		AND attendance_date >= $2
		AND attendance_date <= $3
		ORDER BY attendance_date ASC
	`
	items := make([]AttendanceRecord, 0)
	if err := r.db.SelectContext(ctx, &items, query, employeeID, startDate, endDate); err != nil {
		return nil, fmt.Errorf("list attendance range for employee: %w", err)
	}
	return items, nil
}

func (r *SQLXRepository) GetLunchDaily(ctx context.Context, attendanceDate time.Time) (*LunchDaily, error) {
	query := `
		SELECT
			attendance_date,
			visitors_count,
			plate_cost_amount,
			staff_contribution_amount,
			updated_by_user_id,
			updated_at
		FROM lunch_catering_daily
		WHERE attendance_date = $1
	`
	var item LunchDaily
	if err := r.db.GetContext(ctx, &item, query, attendanceDate); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get lunch daily: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) UpsertLunchVisitors(ctx context.Context, attendanceDate time.Time, visitorsCount int, updatedByUserID int64) (*LunchDaily, error) {
	query := `
		INSERT INTO lunch_catering_daily (
			attendance_date,
			visitors_count,
			updated_by_user_id,
			plate_cost_amount,
			staff_contribution_amount
		)
		VALUES ($1, $2, $3, 12000, 4000)
		ON CONFLICT (attendance_date) DO UPDATE
		SET
			visitors_count = EXCLUDED.visitors_count,
			updated_by_user_id = EXCLUDED.updated_by_user_id,
			updated_at = NOW()
		RETURNING
			attendance_date,
			visitors_count,
			plate_cost_amount,
			staff_contribution_amount,
			updated_by_user_id,
			updated_at
	`
	var item LunchDaily
	if err := r.db.GetContext(ctx, &item, query, attendanceDate, visitorsCount, updatedByUserID); err != nil {
		return nil, fmt.Errorf("upsert lunch visitors: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) CountAttendanceForLunch(ctx context.Context, attendanceDate time.Time) (staffPresentCount int, staffFieldCount int, err error) {
	query := `
		SELECT
			COALESCE(SUM(CASE WHEN status IN ('present', 'late') THEN 1 ELSE 0 END), 0) AS staff_present_count,
			COALESCE(SUM(CASE WHEN status = 'field' THEN 1 ELSE 0 END), 0) AS staff_field_count
		FROM attendance_records
		WHERE attendance_date = $1
	`
	row := struct {
		StaffPresentCount int `db:"staff_present_count"`
		StaffFieldCount   int `db:"staff_field_count"`
	}{}
	if err := r.db.GetContext(ctx, &row, query, attendanceDate); err != nil {
		return 0, 0, fmt.Errorf("count attendance for lunch: %w", err)
	}
	return row.StaffPresentCount, row.StaffFieldCount, nil
}
