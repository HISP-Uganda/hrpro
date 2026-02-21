package audit

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/jmoiron/sqlx"
)

type Repository interface {
	Insert(ctx context.Context, input CreateAuditLogInput) error
	List(ctx context.Context, query ListAuditLogsQuery) ([]AuditLog, int64, error)
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

func (r *SQLXRepository) List(ctx context.Context, query ListAuditLogsQuery) ([]AuditLog, int64, error) {
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
		where = "WHERE LOWER(action) LIKE $1 OR LOWER(COALESCE(entity_type, '')) LIKE $1"
		args = append(args, "%"+strings.ToLower(trimmed)+"%")
	}

	countQuery := `SELECT COUNT(*) FROM audit_logs ` + where
	var total int64
	if err := r.db.GetContext(ctx, &total, countQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("count audit logs: %w", err)
	}

	args = append(args, pageSize, (page-1)*pageSize)
	limitPlaceholder := fmt.Sprintf("$%d", len(args)-1)
	offsetPlaceholder := fmt.Sprintf("$%d", len(args))

	listQuery := `
		SELECT id, actor_user_id, action, entity_type, entity_id, COALESCE(metadata::text, '{}') AS metadata, created_at
		FROM audit_logs
		` + where + `
		ORDER BY created_at DESC
		LIMIT ` + limitPlaceholder + ` OFFSET ` + offsetPlaceholder

	items := make([]AuditLog, 0)
	if err := r.db.SelectContext(ctx, &items, listQuery, args...); err != nil {
		return nil, 0, fmt.Errorf("list audit logs: %w", err)
	}

	return items, total, nil
}
