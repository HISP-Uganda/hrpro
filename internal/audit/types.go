package audit

import "time"

type AuditLog struct {
	ID          int64     `db:"id" json:"id"`
	ActorUserID *int64    `db:"actor_user_id" json:"actorUserId"`
	Action      string    `db:"action" json:"action"`
	EntityType  *string   `db:"entity_type" json:"entityType"`
	EntityID    *int64    `db:"entity_id" json:"entityId"`
	Metadata    string    `db:"metadata" json:"metadata"`
	CreatedAt   time.Time `db:"created_at" json:"createdAt"`
}

type ListAuditLogsQuery struct {
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
	Q        string `json:"q"`
}

type ListAuditLogsResult struct {
	Items      []AuditLog `json:"items"`
	TotalCount int64      `json:"totalCount"`
	Page       int        `json:"page"`
	PageSize   int        `json:"pageSize"`
}
