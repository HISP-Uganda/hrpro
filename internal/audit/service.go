package audit

import (
	"context"
	"fmt"
	"hrpro/internal/models"
	"log"
	"strings"
)

type actorUserIDContextKey struct{}

type Recorder interface {
	RecordAuditEvent(ctx context.Context, actorUserID *int64, action string, entityType *string, entityID *int64, metadata map[string]any)
}

type Service struct {
	repository Repository
}

type noopRecorder struct{}

func NewService(repository Repository) *Service {
	return &Service{repository: repository}
}

func NewNoopRecorder() Recorder {
	return noopRecorder{}
}

func (noopRecorder) RecordAuditEvent(_ context.Context, _ *int64, _ string, _ *string, _ *int64, _ map[string]any) {
}

func (s *Service) RecordAuditEvent(ctx context.Context, actorUserID *int64, action string, entityType *string, entityID *int64, metadata map[string]any) {
	if s == nil || s.repository == nil {
		return
	}

	action = strings.TrimSpace(action)
	if action == "" {
		return
	}

	resolvedActorUserID := actorUserID
	if resolvedActorUserID == nil {
		resolvedActorUserID = ActorUserIDFromContext(ctx)
	}

	err := s.repository.Insert(ctx, CreateAuditLogInput{
		ActorUserID: resolvedActorUserID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Metadata:    metadata,
	})
	if err != nil {
		log.Printf("audit logging failed for action %q: %v", action, err)
	}
}

func (s *Service) ListAuditLogs(ctx context.Context, _ *models.Claims, query ListAuditLogsQuery) (*ListAuditLogsResult, error) {
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 10
	}
	if query.PageSize > 100 {
		query.PageSize = 100
	}

	if s == nil || s.repository == nil {
		return nil, fmt.Errorf("audit repository is not configured")
	}

	items, total, err := s.repository.List(ctx, query)
	if err != nil {
		return nil, err
	}

	return &ListAuditLogsResult{
		Items:      items,
		TotalCount: total,
		Page:       query.Page,
		PageSize:   query.PageSize,
	}, nil
}

func WithActorUserID(ctx context.Context, actorUserID int64) context.Context {
	return context.WithValue(ctx, actorUserIDContextKey{}, actorUserID)
}

func ActorUserIDFromContext(ctx context.Context) *int64 {
	if ctx == nil {
		return nil
	}

	value := ctx.Value(actorUserIDContextKey{})
	actorUserID, ok := value.(int64)
	if !ok || actorUserID <= 0 {
		return nil
	}

	resolved := actorUserID
	return &resolved
}
