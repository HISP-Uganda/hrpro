package departments

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	Create(ctx context.Context, name string, description *string) (*Department, error)
	Update(ctx context.Context, id int64, name string, description *string) (*Department, error)
	Delete(ctx context.Context, id int64) (bool, error)
	GetByID(ctx context.Context, id int64) (*Department, error)
	List(ctx context.Context, query ListDepartmentsQuery) ([]Department, int64, error)
	ExistsByNameCaseInsensitive(ctx context.Context, name string, excludeID *int64) (bool, error)
	CountEmployeesByDepartmentID(ctx context.Context, departmentID int64) (int64, error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) Create(ctx context.Context, name string, description *string) (*Department, error) {
	query := `
        INSERT INTO departments (name, description)
        VALUES ($1, $2)
        RETURNING id, name, description, created_at, updated_at
    `

	var department Department
	if err := r.db.GetContext(ctx, &department, query, name, description); err != nil {
		return nil, fmt.Errorf("create department: %w", err)
	}

	department.EmployeeCount = 0
	return &department, nil
}

func (r *SQLXRepository) Update(ctx context.Context, id int64, name string, description *string) (*Department, error) {
	query := `
        UPDATE departments
        SET name = $2, description = $3, updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, description, created_at, updated_at
    `

	var department Department
	if err := r.db.GetContext(ctx, &department, query, id, name, description); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("update department: %w", err)
	}

	count, err := r.CountEmployeesByDepartmentID(ctx, id)
	if err != nil {
		return nil, err
	}

	department.EmployeeCount = count
	return &department, nil
}

func (r *SQLXRepository) Delete(ctx context.Context, id int64) (bool, error) {
	result, err := r.db.ExecContext(ctx, `DELETE FROM departments WHERE id = $1`, id)
	if err != nil {
		return false, fmt.Errorf("delete department: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("delete department rows affected: %w", err)
	}

	return rows > 0, nil
}

func (r *SQLXRepository) GetByID(ctx context.Context, id int64) (*Department, error) {
	query := `
        SELECT d.id, d.name, d.description,
               COUNT(e.id)::BIGINT AS employee_count,
               d.created_at, d.updated_at
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id
        WHERE d.id = $1
        GROUP BY d.id
    `

	var department Department
	if err := r.db.GetContext(ctx, &department, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("get department by id: %w", err)
	}

	return &department, nil
}

func (r *SQLXRepository) List(ctx context.Context, query ListDepartmentsQuery) ([]Department, int64, error) {
	page := query.Page
	if page <= 0 {
		page = 1
	}

	pageSize := query.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	if pageSize > 100 {
		pageSize = 100
	}

	args := make([]interface{}, 0)
	where := ""

	if trimmed := strings.TrimSpace(query.Q); trimmed != "" {
		args = append(args, "%"+strings.ToLower(trimmed)+"%")
		where = `WHERE (LOWER(name) LIKE $1 OR LOWER(COALESCE(description, '')) LIKE $1)`
	}

	countQuery := `SELECT COUNT(*) FROM departments ` + where

	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count departments: %w", err)
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPlaceholder := fmt.Sprintf("$%d", len(args)-1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(args))

	listQuery := `
        SELECT d.id, d.name, d.description,
               COUNT(e.id)::BIGINT AS employee_count,
               d.created_at, d.updated_at
        FROM departments d
        LEFT JOIN employees e ON e.department_id = d.id
        ` + where + `
        GROUP BY d.id
        ORDER BY d.created_at DESC
        LIMIT ` + limitPlaceholder + ` OFFSET ` + offsetPlaceholder

	departments := make([]Department, 0)
	if err := r.db.SelectContext(ctx, &departments, listQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("list departments: %w", err)
	}

	return departments, total, nil
}

func (r *SQLXRepository) ExistsByNameCaseInsensitive(ctx context.Context, name string, excludeID *int64) (bool, error) {
	var exists bool

	if excludeID == nil {
		query := `SELECT EXISTS(SELECT 1 FROM departments WHERE LOWER(name) = LOWER($1))`
		if err := r.db.GetContext(ctx, &exists, query, name); err != nil {
			return false, fmt.Errorf("check department name exists: %w", err)
		}

		return exists, nil
	}

	query := `SELECT EXISTS(SELECT 1 FROM departments WHERE LOWER(name) = LOWER($1) AND id <> $2)`
	if err := r.db.GetContext(ctx, &exists, query, name, *excludeID); err != nil {
		return false, fmt.Errorf("check department name exists excluding id: %w", err)
	}

	return exists, nil
}

func (r *SQLXRepository) CountEmployeesByDepartmentID(ctx context.Context, departmentID int64) (int64, error) {
	var count int64
	query := `SELECT COUNT(*) FROM employees WHERE department_id = $1`

	if err := r.db.GetContext(ctx, &count, query, departmentID); err != nil {
		return 0, fmt.Errorf("count employees by department: %w", err)
	}

	return count, nil
}
