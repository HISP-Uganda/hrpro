package repositories

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
)

type RefreshTokenRepository interface {
	Store(ctx context.Context, userID int64, tokenHash string, expiresAt time.Time) error
	RevokeByHash(ctx context.Context, tokenHash string) error
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

func (r *SQLXRefreshTokenRepository) RevokeByHash(ctx context.Context, tokenHash string) error {
	query := `
        UPDATE refresh_tokens
        SET revoked_at = NOW()
        WHERE token_hash = $1
          AND revoked_at IS NULL
    `

	if _, err := r.db.ExecContext(ctx, query, tokenHash); err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}

	return nil
}
