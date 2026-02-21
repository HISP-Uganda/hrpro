package audit

import (
	"context"
	"errors"
	"testing"
)

type failingRepository struct{}

func (f *failingRepository) Insert(_ context.Context, _ CreateAuditLogInput) error {
	return errors.New("insert failed")
}

func (f *failingRepository) List(_ context.Context, _ ListAuditLogsQuery) ([]AuditLog, int64, error) {
	return nil, 0, errors.New("list failed")
}

type captureRepository struct {
	lastInput CreateAuditLogInput
	lastQuery ListAuditLogsQuery
}

func (c *captureRepository) Insert(_ context.Context, input CreateAuditLogInput) error {
	c.lastInput = input
	return nil
}

func (c *captureRepository) List(_ context.Context, _ ListAuditLogsQuery) ([]AuditLog, int64, error) {
	return []AuditLog{{ID: 1, Action: "user.login.success", Metadata: "{}"}}, 1, nil
}

func TestRecordAuditEventFailureDoesNotPanic(t *testing.T) {
	service := NewService(&failingRepository{})
	service.RecordAuditEvent(context.Background(), nil, "user.login.success", nil, nil, nil)
}

func TestRecordAuditEventReadsActorFromContext(t *testing.T) {
	repo := &captureRepository{}
	service := NewService(repo)

	ctx := WithActorUserID(context.Background(), 42)
	service.RecordAuditEvent(ctx, nil, "leave.request.create", nil, nil, nil)

	if repo.lastInput.ActorUserID == nil || *repo.lastInput.ActorUserID != 42 {
		t.Fatalf("expected actor user id 42 from context, got %+v", repo.lastInput.ActorUserID)
	}
}

func TestListAuditLogsAppliesPaginationDefaults(t *testing.T) {
	repo := &captureRepository{}
	service := NewService(repo)

	result, err := service.ListAuditLogs(context.Background(), nil, ListAuditLogsQuery{})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if result.Page != 1 {
		t.Fatalf("expected page 1, got %d", result.Page)
	}
	if result.PageSize != 10 {
		t.Fatalf("expected page size 10, got %d", result.PageSize)
	}
	if result.TotalCount != 1 || len(result.Items) != 1 {
		t.Fatalf("expected one result item, got total=%d items=%d", result.TotalCount, len(result.Items))
	}
}
