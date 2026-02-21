package payroll

import (
	"context"
	"errors"
	"testing"
	"time"

	"hrpro/internal/models"
)

type fakeRepository struct {
	batches         map[int64]*PayrollBatch
	entriesByBatch  map[int64][]PayrollEntry
	entryToBatch    map[int64]int64
	activeEmployees []EmployeeSalary
	failEmployeeID  int64
}

type captureAuditRecorder struct {
	actions []string
}

func (c *captureAuditRecorder) RecordAuditEvent(_ context.Context, _ *int64, action string, _ *string, _ *int64, _ map[string]any) {
	c.actions = append(c.actions, action)
}

func (f *fakeRepository) CreateBatch(_ context.Context, month string, createdBy int64) (*PayrollBatch, error) {
	batch := &PayrollBatch{ID: int64(len(f.batches) + 1), Month: month, Status: StatusDraft, CreatedBy: createdBy, CreatedAt: time.Now().UTC()}
	f.batches[batch.ID] = batch
	return batch, nil
}

func (f *fakeRepository) ListBatches(_ context.Context, _ ListBatchesFilter) ([]PayrollBatch, int64, int, int, error) {
	items := make([]PayrollBatch, 0, len(f.batches))
	for _, batch := range f.batches {
		items = append(items, *batch)
	}
	return items, int64(len(items)), 1, 10, nil
}

func (f *fakeRepository) GetBatchByID(_ context.Context, batchID int64) (*PayrollBatch, error) {
	batch := f.batches[batchID]
	if batch == nil {
		return nil, nil
	}
	copyBatch := *batch
	return &copyBatch, nil
}

func (f *fakeRepository) GetBatchByEntryID(_ context.Context, entryID int64) (*PayrollBatch, error) {
	batchID, ok := f.entryToBatch[entryID]
	if !ok {
		return nil, nil
	}
	return f.GetBatchByID(context.Background(), batchID)
}

func (f *fakeRepository) ListEntriesByBatchID(_ context.Context, batchID int64) ([]PayrollEntry, error) {
	items := f.entriesByBatch[batchID]
	cloned := make([]PayrollEntry, len(items))
	copy(cloned, items)
	return cloned, nil
}

func (f *fakeRepository) UpdateEntryAmounts(_ context.Context, entryID int64, allowancesTotal, deductionsTotal, taxTotal, grossPay, netPay float64) (*PayrollEntry, error) {
	batchID := f.entryToBatch[entryID]
	items := f.entriesByBatch[batchID]
	for i := range items {
		if items[i].ID == entryID {
			items[i].AllowancesTotal = allowancesTotal
			items[i].DeductionsTotal = deductionsTotal
			items[i].TaxTotal = taxTotal
			items[i].GrossPay = grossPay
			items[i].NetPay = netPay
			f.entriesByBatch[batchID] = items
			entry := items[i]
			return &entry, nil
		}
	}
	return nil, nil
}

func (f *fakeRepository) SetBatchApproved(_ context.Context, batchID int64, approvedBy int64) (*PayrollBatch, error) {
	batch := f.batches[batchID]
	if batch == nil {
		return nil, nil
	}
	now := time.Now().UTC()
	batch.Status = StatusApproved
	batch.ApprovedBy = &approvedBy
	batch.ApprovedAt = &now
	copyBatch := *batch
	return &copyBatch, nil
}

func (f *fakeRepository) SetBatchLocked(_ context.Context, batchID int64) (*PayrollBatch, error) {
	batch := f.batches[batchID]
	if batch == nil {
		return nil, nil
	}
	now := time.Now().UTC()
	batch.Status = StatusLocked
	batch.LockedAt = &now
	copyBatch := *batch
	return &copyBatch, nil
}

func (f *fakeRepository) WithTx(ctx context.Context, fn func(tx TxRepository) error) error {
	staged := make(map[int64][]PayrollEntry, len(f.entriesByBatch))
	for batchID, entries := range f.entriesByBatch {
		cloned := make([]PayrollEntry, len(entries))
		copy(cloned, entries)
		staged[batchID] = cloned
	}

	tx := &fakeTxRepository{parent: f, stagedEntriesByBatch: staged}
	if err := fn(tx); err != nil {
		return err
	}

	f.entriesByBatch = tx.stagedEntriesByBatch
	f.entryToBatch = tx.stagedEntryToBatch
	return nil
}

type fakeTxRepository struct {
	parent               *fakeRepository
	stagedEntriesByBatch map[int64][]PayrollEntry
	stagedEntryToBatch   map[int64]int64
	nextID               int64
}

func (f *fakeTxRepository) ensureState() {
	if f.stagedEntryToBatch != nil {
		return
	}
	f.stagedEntryToBatch = make(map[int64]int64, len(f.parent.entryToBatch))
	for entryID, batchID := range f.parent.entryToBatch {
		f.stagedEntryToBatch[entryID] = batchID
	}
	var maxID int64
	for entryID := range f.stagedEntryToBatch {
		if entryID > maxID {
			maxID = entryID
		}
	}
	f.nextID = maxID + 1
}

func (f *fakeTxRepository) DeleteEntriesByBatchID(_ context.Context, batchID int64) error {
	f.ensureState()
	for entryID, mappedBatchID := range f.stagedEntryToBatch {
		if mappedBatchID == batchID {
			delete(f.stagedEntryToBatch, entryID)
		}
	}
	f.stagedEntriesByBatch[batchID] = []PayrollEntry{}
	return nil
}

func (f *fakeTxRepository) ListActiveEmployeeSalaries(_ context.Context) ([]EmployeeSalary, error) {
	items := make([]EmployeeSalary, len(f.parent.activeEmployees))
	copy(items, f.parent.activeEmployees)
	return items, nil
}

func (f *fakeTxRepository) CreateEntry(_ context.Context, input EntryCreateInput) error {
	f.ensureState()
	if f.parent.failEmployeeID != 0 && input.EmployeeID == f.parent.failEmployeeID {
		return errors.New("forced create error")
	}
	entry := PayrollEntry{
		ID:              f.nextID,
		BatchID:         input.BatchID,
		EmployeeID:      input.EmployeeID,
		BaseSalary:      input.BaseSalary,
		AllowancesTotal: input.AllowancesTotal,
		DeductionsTotal: input.DeductionsTotal,
		TaxTotal:        input.TaxTotal,
		GrossPay:        input.GrossPay,
		NetPay:          input.NetPay,
	}
	f.nextID++
	f.stagedEntriesByBatch[input.BatchID] = append(f.stagedEntriesByBatch[input.BatchID], entry)
	f.stagedEntryToBatch[entry.ID] = input.BatchID
	return nil
}

func TestApprovePayrollBatchRequiresDraft(t *testing.T) {
	repo := &fakeRepository{
		batches: map[int64]*PayrollBatch{1: {ID: 1, Status: StatusApproved}},
	}
	service := NewService(repo)

	_, err := service.ApprovePayrollBatch(context.Background(), &models.Claims{UserID: 1, Role: "Admin"}, 1)
	if !errors.Is(err, ErrInvalidTransition) {
		t.Fatalf("expected ErrInvalidTransition, got %v", err)
	}
}

func TestLockPayrollBatchRequiresApproved(t *testing.T) {
	repo := &fakeRepository{
		batches: map[int64]*PayrollBatch{1: {ID: 1, Status: StatusDraft}},
	}
	service := NewService(repo)

	_, err := service.LockPayrollBatch(context.Background(), 1)
	if !errors.Is(err, ErrInvalidTransition) {
		t.Fatalf("expected ErrInvalidTransition, got %v", err)
	}
}

func TestUpdatePayrollEntryAmountsRequiresDraftBatch(t *testing.T) {
	repo := &fakeRepository{
		batches: map[int64]*PayrollBatch{10: {ID: 10, Status: StatusLocked}},
		entriesByBatch: map[int64][]PayrollEntry{
			10: {{ID: 44, BatchID: 10, BaseSalary: 1000}},
		},
		entryToBatch: map[int64]int64{44: 10},
	}
	service := NewService(repo)

	_, err := service.UpdatePayrollEntryAmounts(context.Background(), 44, UpdateEntryAmountsInput{
		AllowancesTotal: 100,
		DeductionsTotal: 20,
		TaxTotal:        10,
	})
	if !errors.Is(err, ErrImmutableBatch) {
		t.Fatalf("expected ErrImmutableBatch, got %v", err)
	}
}

func TestGeneratePayrollEntriesRollsBackOnInsertFailure(t *testing.T) {
	repo := &fakeRepository{
		batches: map[int64]*PayrollBatch{7: {ID: 7, Status: StatusDraft}},
		entriesByBatch: map[int64][]PayrollEntry{
			7: {{ID: 99, BatchID: 7, EmployeeID: 55, BaseSalary: 500}},
		},
		entryToBatch: map[int64]int64{99: 7},
		activeEmployees: []EmployeeSalary{
			{EmployeeID: 101, EmployeeName: "A", BaseSalary: 1200},
			{EmployeeID: 202, EmployeeName: "B", BaseSalary: 1500},
		},
		failEmployeeID: 202,
	}
	service := NewService(repo)

	err := service.GeneratePayrollEntries(context.Background(), 7)
	if err == nil {
		t.Fatal("expected generation error")
	}

	entries := repo.entriesByBatch[7]
	if len(entries) != 1 || entries[0].ID != 99 {
		t.Fatalf("expected rollback to preserve existing entries, got %#v", entries)
	}

	if repo.entryToBatch[99] != 7 {
		t.Fatalf("expected original entry mapping to remain after rollback")
	}
}

func TestCreatePayrollBatchRecordsAuditEvent(t *testing.T) {
	repo := &fakeRepository{
		batches:        map[int64]*PayrollBatch{},
		entriesByBatch: map[int64][]PayrollEntry{},
		entryToBatch:   map[int64]int64{},
	}
	service := NewService(repo)
	recorder := &captureAuditRecorder{}
	service.SetAuditRecorder(recorder)

	_, err := service.CreatePayrollBatch(context.Background(), &models.Claims{UserID: 99, Role: "Admin"}, CreateBatchInput{
		Month: "2026-02",
	})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(recorder.actions) != 1 || recorder.actions[0] != "payroll.batch.create" {
		t.Fatalf("expected payroll.batch.create audit action, got %v", recorder.actions)
	}
}
