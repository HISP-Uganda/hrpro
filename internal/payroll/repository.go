package payroll

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jmoiron/sqlx"
)

type EntryCreateInput struct {
	BatchID         int64
	EmployeeID      int64
	BaseSalary      float64
	AllowancesTotal float64
	DeductionsTotal float64
	TaxTotal        float64
	GrossPay        float64
	NetPay          float64
}

type Repository interface {
	CreateBatch(ctx context.Context, month string, createdBy int64) (*PayrollBatch, error)
	ListBatches(ctx context.Context, filter ListBatchesFilter) ([]PayrollBatch, int64, int, int, error)
	GetBatchByID(ctx context.Context, batchID int64) (*PayrollBatch, error)
	GetBatchByEntryID(ctx context.Context, entryID int64) (*PayrollBatch, error)
	ListEntriesByBatchID(ctx context.Context, batchID int64) ([]PayrollEntry, error)
	UpdateEntryAmounts(ctx context.Context, entryID int64, allowancesTotal, deductionsTotal, taxTotal, grossPay, netPay float64) (*PayrollEntry, error)
	SetBatchApproved(ctx context.Context, batchID int64, approvedBy int64) (*PayrollBatch, error)
	SetBatchLocked(ctx context.Context, batchID int64) (*PayrollBatch, error)
	WithTx(ctx context.Context, fn func(tx TxRepository) error) error
}

type TxRepository interface {
	DeleteEntriesByBatchID(ctx context.Context, batchID int64) error
	ListActiveEmployeeSalaries(ctx context.Context) ([]EmployeeSalary, error)
	CreateEntry(ctx context.Context, input EntryCreateInput) error
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) CreateBatch(ctx context.Context, month string, createdBy int64) (*PayrollBatch, error) {
	query := `
		INSERT INTO payroll_batches (month, status, created_by)
		VALUES ($1, $2, $3)
		RETURNING id, month, status, created_by, created_at, approved_by, approved_at, locked_at
	`

	var batch PayrollBatch
	if err := r.db.GetContext(ctx, &batch, query, month, StatusDraft, createdBy); err != nil {
		if isUniqueViolation(err) {
			return nil, ErrDuplicateMonth
		}
		return nil, fmt.Errorf("create payroll batch: %w", err)
	}

	return &batch, nil
}

func (r *SQLXRepository) ListBatches(ctx context.Context, filter ListBatchesFilter) ([]PayrollBatch, int64, int, int, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}

	args := make([]any, 0)
	where := make([]string, 0)
	addArg := func(v any) string {
		args = append(args, v)
		return fmt.Sprintf("$%d", len(args))
	}

	if month := strings.TrimSpace(filter.Month); month != "" {
		ph := addArg(month)
		where = append(where, "month = "+ph)
	}

	if status := strings.TrimSpace(filter.Status); status != "" {
		ph := addArg(status)
		where = append(where, "status = "+ph)
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = " WHERE " + strings.Join(where, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM payroll_batches" + whereClause
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count payroll batches: %w", err)
	}

	offset := (page - 1) * pageSize
	limitPH := addArg(pageSize)
	offsetPH := addArg(offset)

	listQuery := `
		SELECT id, month, status, created_by, created_at, approved_by, approved_at, locked_at
		FROM payroll_batches` + whereClause + `
		ORDER BY month DESC
		LIMIT ` + limitPH + ` OFFSET ` + offsetPH

	items := make([]PayrollBatch, 0)
	if err := r.db.SelectContext(ctx, &items, listQuery, args...); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("list payroll batches: %w", err)
	}

	return items, total, page, pageSize, nil
}

func (r *SQLXRepository) GetBatchByID(ctx context.Context, batchID int64) (*PayrollBatch, error) {
	query := `
		SELECT id, month, status, created_by, created_at, approved_by, approved_at, locked_at
		FROM payroll_batches
		WHERE id = $1
	`

	var batch PayrollBatch
	if err := r.db.GetContext(ctx, &batch, query, batchID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get payroll batch: %w", err)
	}

	return &batch, nil
}

func (r *SQLXRepository) GetBatchByEntryID(ctx context.Context, entryID int64) (*PayrollBatch, error) {
	query := `
		SELECT pb.id, pb.month, pb.status, pb.created_by, pb.created_at, pb.approved_by, pb.approved_at, pb.locked_at
		FROM payroll_batches pb
		INNER JOIN payroll_entries pe ON pe.batch_id = pb.id
		WHERE pe.id = $1
	`

	var batch PayrollBatch
	if err := r.db.GetContext(ctx, &batch, query, entryID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get payroll batch by entry id: %w", err)
	}

	return &batch, nil
}

func (r *SQLXRepository) ListEntriesByBatchID(ctx context.Context, batchID int64) ([]PayrollEntry, error) {
	query := `
		SELECT
			pe.id,
			pe.batch_id,
			pe.employee_id,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) AS employee_name,
			CAST(pe.base_salary AS DOUBLE PRECISION) AS base_salary,
			CAST(pe.allowances_total AS DOUBLE PRECISION) AS allowances_total,
			CAST(pe.deductions_total AS DOUBLE PRECISION) AS deductions_total,
			CAST(pe.tax_total AS DOUBLE PRECISION) AS tax_total,
			CAST(pe.gross_pay AS DOUBLE PRECISION) AS gross_pay,
			CAST(pe.net_pay AS DOUBLE PRECISION) AS net_pay,
			pe.created_at,
			pe.updated_at
		FROM payroll_entries pe
		INNER JOIN employees e ON e.id = pe.employee_id
		WHERE pe.batch_id = $1
		ORDER BY e.last_name ASC, e.first_name ASC
	`

	items := make([]PayrollEntry, 0)
	if err := r.db.SelectContext(ctx, &items, query, batchID); err != nil {
		return nil, fmt.Errorf("list payroll entries: %w", err)
	}

	return items, nil
}

func (r *SQLXRepository) UpdateEntryAmounts(ctx context.Context, entryID int64, allowancesTotal, deductionsTotal, taxTotal, grossPay, netPay float64) (*PayrollEntry, error) {
	query := `
		UPDATE payroll_entries
		SET
			allowances_total = $2,
			deductions_total = $3,
			tax_total = $4,
			gross_pay = $5,
			net_pay = $6,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id
	`

	var id int64
	if err := r.db.GetContext(ctx, &id, query, entryID, allowancesTotal, deductionsTotal, taxTotal, grossPay, netPay); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("update payroll entry amounts: %w", err)
	}

	entry, err := r.getEntryByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return entry, nil
}

func (r *SQLXRepository) SetBatchApproved(ctx context.Context, batchID int64, approvedBy int64) (*PayrollBatch, error) {
	query := `
		UPDATE payroll_batches
		SET status = $2, approved_by = $3, approved_at = NOW()
		WHERE id = $1
		RETURNING id, month, status, created_by, created_at, approved_by, approved_at, locked_at
	`

	var batch PayrollBatch
	if err := r.db.GetContext(ctx, &batch, query, batchID, StatusApproved, approvedBy); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("set payroll batch approved: %w", err)
	}

	return &batch, nil
}

func (r *SQLXRepository) SetBatchLocked(ctx context.Context, batchID int64) (*PayrollBatch, error) {
	query := `
		UPDATE payroll_batches
		SET status = $2, locked_at = NOW()
		WHERE id = $1
		RETURNING id, month, status, created_by, created_at, approved_by, approved_at, locked_at
	`

	var batch PayrollBatch
	if err := r.db.GetContext(ctx, &batch, query, batchID, StatusLocked); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("set payroll batch locked: %w", err)
	}

	return &batch, nil
}

func (r *SQLXRepository) WithTx(ctx context.Context, fn func(tx TxRepository) error) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin payroll transaction: %w", err)
	}

	txRepo := &sqlxTxRepository{tx: tx}
	if err := fn(txRepo); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit payroll transaction: %w", err)
	}

	return nil
}

func (r *SQLXRepository) getEntryByID(ctx context.Context, entryID int64) (*PayrollEntry, error) {
	query := `
		SELECT
			pe.id,
			pe.batch_id,
			pe.employee_id,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) AS employee_name,
			CAST(pe.base_salary AS DOUBLE PRECISION) AS base_salary,
			CAST(pe.allowances_total AS DOUBLE PRECISION) AS allowances_total,
			CAST(pe.deductions_total AS DOUBLE PRECISION) AS deductions_total,
			CAST(pe.tax_total AS DOUBLE PRECISION) AS tax_total,
			CAST(pe.gross_pay AS DOUBLE PRECISION) AS gross_pay,
			CAST(pe.net_pay AS DOUBLE PRECISION) AS net_pay,
			pe.created_at,
			pe.updated_at
		FROM payroll_entries pe
		INNER JOIN employees e ON e.id = pe.employee_id
		WHERE pe.id = $1
	`

	var entry PayrollEntry
	if err := r.db.GetContext(ctx, &entry, query, entryID); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get payroll entry by id: %w", err)
	}
	return &entry, nil
}

type sqlxTxRepository struct {
	tx *sqlx.Tx
}

func (r *sqlxTxRepository) DeleteEntriesByBatchID(ctx context.Context, batchID int64) error {
	query := `DELETE FROM payroll_entries WHERE batch_id = $1`
	if _, err := r.tx.ExecContext(ctx, query, batchID); err != nil {
		return fmt.Errorf("delete payroll entries by batch id: %w", err)
	}
	return nil
}

func (r *sqlxTxRepository) ListActiveEmployeeSalaries(ctx context.Context) ([]EmployeeSalary, error) {
	query := `
		SELECT
			e.id AS employee_id,
			TRIM(CONCAT(e.first_name, ' ', e.last_name)) AS employee_name,
			CAST(e.base_salary_amount AS DOUBLE PRECISION) AS base_salary
		FROM employees e
		WHERE LOWER(TRIM(e.employment_status)) = 'active'
		ORDER BY e.last_name ASC, e.first_name ASC
	`
	items := make([]EmployeeSalary, 0)
	if err := r.tx.SelectContext(ctx, &items, query); err != nil {
		return nil, fmt.Errorf("list active employee salaries: %w", err)
	}
	return items, nil
}

func (r *sqlxTxRepository) CreateEntry(ctx context.Context, input EntryCreateInput) error {
	query := `
		INSERT INTO payroll_entries (
			batch_id,
			employee_id,
			base_salary,
			allowances_total,
			deductions_total,
			tax_total,
			gross_pay,
			net_pay
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	if _, err := r.tx.ExecContext(
		ctx,
		query,
		input.BatchID,
		input.EmployeeID,
		input.BaseSalary,
		input.AllowancesTotal,
		input.DeductionsTotal,
		input.TaxTotal,
		input.GrossPay,
		input.NetPay,
	); err != nil {
		return fmt.Errorf("create payroll entry: %w", err)
	}
	return nil
}

func isUniqueViolation(err error) bool {
	pgErr := &pgconn.PgError{}
	if errors.As(err, &pgErr) {
		return pgErr.Code == "23505"
	}
	return false
}
