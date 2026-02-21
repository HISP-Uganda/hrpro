package audit

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	Insert(ctx context.Context, input CreateAuditLogInput) error
}

type SQLXRepository struct {
	db *sqlx.DB
}

type CreateAuditLogInput struct {
	ActorUserID *int64
	Action      string
	EntityType  *string
	EntityID    *int64
	Metadata    map[string]any
}

func NewRepository(db *sqlx.DB) *SQLXRepository {
	return &SQLXRepository{db: db}
}

func (r *SQLXRepository) Insert(ctx context.Context, input CreateAuditLogInput) error {
	var metadataJSON *string
	if input.Metadata != nil {
		payload, err := json.Marshal(input.Metadata)
		if err != nil {
			return fmt.Errorf("marshal audit metadata: %w", err)
		}
		serialized := string(payload)
		metadataJSON = &serialized
	}

	query := `
		INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
		VALUES ($1, $2, $3, $4, $5::jsonb)
	`
	if _, err := r.db.ExecContext(ctx, query, input.ActorUserID, input.Action, input.EntityType, input.EntityID, metadataJSON); err != nil {
		return fmt.Errorf("insert audit log: %w", err)
	}

	return nil
}
