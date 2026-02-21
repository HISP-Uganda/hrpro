package repositories

import (
	"context"
	"database/sql"
	"fmt"

	"hrpro/internal/models"

	"github.com/jmoiron/sqlx"
)

type UserRepository interface {
	GetByUsername(ctx context.Context, username string) (*models.User, error)
	GetByID(ctx context.Context, id int64) (*models.User, error)
	CreateUser(ctx context.Context, username, passwordHash, role string, isActive bool) (*models.User, error)
}

type SQLXUserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *SQLXUserRepository {
	return &SQLXUserRepository{db: db}
}

func (r *SQLXUserRepository) GetByUsername(ctx context.Context, username string) (*models.User, error) {
	var user models.User
	query := `
        SELECT id, username, password_hash, role, is_active, created_at, updated_at
        FROM users
        WHERE username = $1
    `

	if err := r.db.GetContext(ctx, &user, query, username); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("select user by username: %w", err)
	}

	return &user, nil
}

func (r *SQLXUserRepository) GetByID(ctx context.Context, id int64) (*models.User, error) {
	var user models.User
	query := `
        SELECT id, username, password_hash, role, is_active, created_at, updated_at
        FROM users
        WHERE id = $1
    `

	if err := r.db.GetContext(ctx, &user, query, id); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		return nil, fmt.Errorf("select user by id: %w", err)
	}

	return &user, nil
}

func (r *SQLXUserRepository) CreateUser(ctx context.Context, username, passwordHash, role string, isActive bool) (*models.User, error) {
	var user models.User
	query := `
        INSERT INTO users (username, password_hash, role, is_active)
        VALUES ($1, $2, $3, $4)
        RETURNING id, username, password_hash, role, is_active, created_at, updated_at
    `

	if err := r.db.GetContext(ctx, &user, query, username, passwordHash, role, isActive); err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}

	return &user, nil
}
