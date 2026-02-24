package repositories

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"hrpro/internal/models"

	"github.com/jmoiron/sqlx"
)

type RefreshTokenRepository interface {
	Store(ctx context.Context, userID int64, tokenHash string, expiresAt time.Time) error
	GetByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
	RevokeByHash(ctx context.Context, tokenHash string) (bool, error)
	RevokeAllByUserID(ctx context.Context, userID int64) error
}

type SQLXRefreshTokenRepository struct {
	db *sqlx.DB
}

func NewRefreshTokenRepository(db *sqlx.DB) *SQLXRefreshTokenRepository {
	return &SQLXRefreshTokenRepository{db: db}
}

func (r *SQLXRefreshTokenRepository) Store(ctx context.Context, userID int64, tokenHash string, expiresAt time.Time) error {
	query := `
        INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
    `

	if _, err := r.db.ExecContext(ctx, query, userID, tokenHash, expiresAt); err != nil {
		return fmt.Errorf("insert refresh token: %w", err)
	}

	return nil
}

func (r *SQLXRefreshTokenRepository) GetByHash(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	const query = `
		SELECT id, user_id, token_hash, expires_at, revoked_at, created_at
		FROM refresh_tokens
		WHERE token_hash = $1
	`

	var token models.RefreshToken
	if err := r.db.GetContext(ctx, &token, query, tokenHash); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get refresh token by hash: %w", err)
	}

	return &token, nil
}

func (r *SQLXRefreshTokenRepository) RevokeByHash(ctx context.Context, tokenHash string) (bool, error) {
	query := `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1
          AND revoked_at IS NULL
    `

	result, err := r.db.ExecContext(ctx, query, tokenHash)
	if err != nil {
		return false, fmt.Errorf("revoke refresh token: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, fmt.Errorf("read revoke refresh token affected rows: %w", err)
	}

	return rowsAffected > 0, nil
}

func (r *SQLXRefreshTokenRepository) RevokeAllByUserID(ctx context.Context, userID int64) error {
	const query = `
		UPDATE refresh_tokens
		SET revoked_at = NOW()
		WHERE user_id = $1
		  AND revoked_at IS NULL
	`
	if _, err := r.db.ExecContext(ctx, query, userID); err != nil {
		return fmt.Errorf("revoke all refresh tokens by user: %w", err)
	}

	return nil
}
