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

type captureRepository struct {
	lastInput CreateAuditLogInput
}

func (c *captureRepository) Insert(_ context.Context, input CreateAuditLogInput) error {
	c.lastInput = input
	return nil
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
