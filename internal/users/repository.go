package users

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	GetByID(ctx context.Context, id int64) (*User, error)
	List(ctx context.Context, query ListUsersQuery) ([]User, int64, error)
	ExistsByUsernameCaseInsensitive(ctx context.Context, username string, excludeID *int64) (bool, error)
	Create(ctx context.Context, username, passwordHash, role string) (*User, error)
	Update(ctx context.Context, id int64, username, role string) (*User, error)
	UpdatePasswordHash(ctx context.Context, id int64, passwordHash string) (bool, error)
	SetActive(ctx context.Context, id int64, active bool) (*User, error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) GetByID(ctx context.Context, id int64) (*User, error) {
	var user User
	query := `
		SELECT id, username, role, is_active, created_at, updated_at, last_login_at
		FROM users
		WHERE id = $1
	`
	if err := r.db.GetContext(ctx, &user, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &user, nil
}

func (r *SQLXRepository) List(ctx context.Context, query ListUsersQuery) ([]User, int64, error) {
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

	args := make([]interface{}, 0, 3)
	where := ""
	if trimmed := strings.TrimSpace(query.Q); trimmed != "" {
		where = "WHERE LOWER(username) LIKE $1"
		args = append(args, "%"+strings.ToLower(trimmed)+"%")
	}

	countQuery := `SELECT COUNT(*) FROM users ` + where
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count users: %w", err)
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPlaceholder := fmt.Sprintf("$%d", len(args)-1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(args))
	listQuery := `
		SELECT id, username, role, is_active, created_at, updated_at, last_login_at
		FROM users
		` + where + `
		ORDER BY created_at DESC
		LIMIT ` + limitPlaceholder + ` OFFSET ` + offsetPlaceholder

	items := make([]User, 0)
	if err := r.db.SelectContext(ctx, &items, listQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("list users: %w", err)
	}
	return items, total, nil
}

func (r *SQLXRepository) ExistsByUsernameCaseInsensitive(ctx context.Context, username string, excludeID *int64) (bool, error) {
	var exists bool
	if excludeID == nil {
		query := `SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(username) = LOWER($1))`
		if err := r.db.GetContext(ctx, &exists, query, username); err != nil {
			return false, fmt.Errorf("check username exists: %w", err)
		}
		return exists, nil
	}

	query := `SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2)`
	if err := r.db.GetContext(ctx, &exists, query, username, *excludeID); err != nil {
		return false, fmt.Errorf("check username exists excluding id: %w", err)
	}
	return exists, nil
}

func (r *SQLXRepository) Create(ctx context.Context, username, passwordHash, role string) (*User, error) {
	var user User
	query := `
		INSERT INTO users (username, password_hash, role, is_active)
		VALUES ($1, $2, $3, TRUE)
		RETURNING id, username, role, is_active, created_at, updated_at, last_login_at
	`
	if err := r.db.GetContext(ctx, &user, query, username, passwordHash, role); err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	return &user, nil
}

func (r *SQLXRepository) Update(ctx context.Context, id int64, username, role string) (*User, error) {
	var user User
	query := `
		UPDATE users
		SET username = $2, role = $3, updated_at = NOW()
		WHERE id = $1
		RETURNING id, username, role, is_active, created_at, updated_at, last_login_at
	`
	if err := r.db.GetContext(ctx, &user, query, id, username, role); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("update user: %w", err)
	}
	return &user, nil
}

func (r *SQLXRepository) UpdatePasswordHash(ctx context.Context, id int64, passwordHash string) (bool, error) {
	result, err := r.db.ExecContext(ctx, `UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`, id, passwordHash)
	if err != nil {
		return false, fmt.Errorf("update user password hash: %w", err)
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("update user password rows affected: %w", err)
	}
	return rows > 0, nil
}

func (r *SQLXRepository) SetActive(ctx context.Context, id int64, active bool) (*User, error) {
	var user User
	query := `
		UPDATE users
		SET is_active = $2, updated_at = NOW()
		WHERE id = $1
		RETURNING id, username, role, is_active, created_at, updated_at, last_login_at
	`
	if err := r.db.GetContext(ctx, &user, query, id, active); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("set user active: %w", err)
	}
	return &user, nil
}
