package settings

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	GetByKey(ctx context.Context, key string) (*StoredSetting, error)
	Upsert(ctx context.Context, key string, valueJSON []byte, updatedByUserID int64) (*StoredSetting, error)
}

type SQLXRepository struct {
	db *sqlx.DB
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) GetByKey(ctx context.Context, key string) (*StoredSetting, error) {
	query := `
		SELECT
			"key",
			value_json,
			updated_by_user_id,
			updated_at
		FROM app_settings
		WHERE "key" = $1
	`

	var item StoredSetting
	if err := r.db.GetContext(ctx, &item, query, key); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("get app setting by key: %w", err)
	}
	return &item, nil
}

func (r *SQLXRepository) Upsert(ctx context.Context, key string, valueJSON []byte, updatedByUserID int64) (*StoredSetting, error) {
	query := `
		INSERT INTO app_settings ("key", value_json, updated_by_user_id, updated_at)
		VALUES ($1, $2::jsonb, $3, NOW())
		ON CONFLICT ("key") DO UPDATE
		SET
			value_json = EXCLUDED.value_json,
			updated_by_user_id = EXCLUDED.updated_by_user_id,
			updated_at = NOW()
		RETURNING
			"key",
			value_json,
			updated_by_user_id,
			updated_at
	`

	var item StoredSetting
	if err := r.db.GetContext(ctx, &item, query, key, string(valueJSON), updatedByUserID); err != nil {
		return nil, fmt.Errorf("upsert app setting: %w", err)
	}
	return &item, nil
}
