package employees

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	Create(ctx context.Context, input RepositoryUpsertInput) (*Employee, error)
	Update(ctx context.Context, id int64, input RepositoryUpsertInput) (*Employee, error)
	Delete(ctx context.Context, id int64) (bool, error)
	GetByID(ctx context.Context, id int64) (*Employee, error)
	List(ctx context.Context, query ListEmployeesQuery) ([]Employee, int64, error)
}

type RepositoryUpsertInput struct {
	FirstName        string
	LastName         string
	OtherName        *string
	Gender           *string
	DateOfBirth      *time.Time
	Phone            *string
	Email            *string
	NationalID       *string
	Address          *string
	DepartmentID     *int64
	Position         string
	EmploymentStatus string
	DateOfHire       time.Time
	BaseSalaryAmount float64
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) Create(ctx context.Context, input RepositoryUpsertInput) (*Employee, error) {
	query := `
        INSERT INTO employees (
            first_name, last_name, other_name, gender, dob, phone, email, national_id,
            address, department_id, position, employment_status, date_of_hire, base_salary_amount
        )
        VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14
        )
        RETURNING id, first_name, last_name, other_name, gender, dob, phone, email, national_id,
            address, department_id, position, employment_status, date_of_hire,
            base_salary_amount, created_at, updated_at
    `

	var employee Employee
	if err := r.db.GetContext(
		ctx,
		&employee,
		query,
		input.FirstName,
		input.LastName,
		input.OtherName,
		input.Gender,
		input.DateOfBirth,
		input.Phone,
		input.Email,
		input.NationalID,
		input.Address,
		input.DepartmentID,
		input.Position,
		input.EmploymentStatus,
		input.DateOfHire,
		input.BaseSalaryAmount,
	); err != nil {
		return nil, fmt.Errorf("create employee: %w", err)
	}

	return &employee, nil
}

func (r *SQLXRepository) Update(ctx context.Context, id int64, input RepositoryUpsertInput) (*Employee, error) {
	query := `
        UPDATE employees
        SET
            first_name = $2,
            last_name = $3,
            other_name = $4,
            gender = $5,
            dob = $6,
            phone = $7,
            email = $8,
            national_id = $9,
            address = $10,
            department_id = $11,
            position = $12,
            employment_status = $13,
            date_of_hire = $14,
            base_salary_amount = $15,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, first_name, last_name, other_name, gender, dob, phone, email, national_id,
            address, department_id, position, employment_status, date_of_hire,
            base_salary_amount, created_at, updated_at
    `

	var employee Employee
	err := r.db.GetContext(
		ctx,
		&employee,
		query,
		id,
		input.FirstName,
		input.LastName,
		input.OtherName,
		input.Gender,
		input.DateOfBirth,
		input.Phone,
		input.Email,
		input.NationalID,
		input.Address,
		input.DepartmentID,
		input.Position,
		input.EmploymentStatus,
		input.DateOfHire,
		input.BaseSalaryAmount,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("update employee: %w", err)
	}

	return &employee, nil
}

func (r *SQLXRepository) Delete(ctx context.Context, id int64) (bool, error) {
	query := `DELETE FROM employees WHERE id = $1`

	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return false, fmt.Errorf("delete employee: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("delete employee rows affected: %w", err)
	}

	return rows > 0, nil
}

func (r *SQLXRepository) GetByID(ctx context.Context, id int64) (*Employee, error) {
	query := `
        SELECT e.id, e.first_name, e.last_name, e.other_name, e.gender, e.dob, e.phone, e.email, e.national_id,
            e.address, e.department_id, d.name AS department_name, e.position, e.employment_status, e.date_of_hire,
            e.base_salary_amount, e.created_at, e.updated_at
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
        WHERE e.id = $1
    `

	var employee Employee
	if err := r.db.GetContext(ctx, &employee, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("get employee by id: %w", err)
	}

	return &employee, nil
}

func (r *SQLXRepository) List(ctx context.Context, query ListEmployeesQuery) ([]Employee, int64, error) {
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
	where := make([]string, 0)

	addArg := func(value interface{}) string {
		args = append(args, value)
		return fmt.Sprintf("$%d", len(args))
	}

	if trimmed := strings.TrimSpace(query.Q); trimmed != "" {
		search := "%" + strings.ToLower(trimmed) + "%"
		placeholder := addArg(search)
		where = append(where, "(LOWER(first_name) LIKE "+placeholder+" OR LOWER(last_name) LIKE "+placeholder+" OR LOWER(COALESCE(other_name, '')) LIKE "+placeholder+")")
	}

	if trimmed := strings.TrimSpace(query.Status); trimmed != "" {
		placeholder := addArg(trimmed)
		where = append(where, "employment_status = "+placeholder)
	}

	if query.DepartmentID != nil {
		placeholder := addArg(*query.DepartmentID)
		where = append(where, "department_id = "+placeholder)
	}

	whereClause := ""
	if len(where) > 0 {
		whereClause = "WHERE " + strings.Join(where, " AND ")
	}

	countQuery := "SELECT COUNT(*) FROM employees " + whereClause

	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count employees: %w", err)
	}

	offset := (page - 1) * pageSize
	limitPlaceholder := addArg(pageSize)
	offsetPlaceholder := addArg(offset)

	listQuery := `
        SELECT e.id, e.first_name, e.last_name, e.other_name, e.gender, e.dob, e.phone, e.email, e.national_id,
            e.address, e.department_id, d.name AS department_name, e.position, e.employment_status, e.date_of_hire,
            e.base_salary_amount, e.created_at, e.updated_at
        FROM employees e
        LEFT JOIN departments d ON d.id = e.department_id
    ` + strings.ReplaceAll(whereClause, "first_name", "e.first_name") + `
        ORDER BY e.created_at DESC
        LIMIT ` + limitPlaceholder + ` OFFSET ` + offsetPlaceholder

	items := make([]Employee, 0)
	if err := r.db.SelectContext(ctx, &items, listQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("list employees: %w", err)
	}

	return items, total, nil
}
