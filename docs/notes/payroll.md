# Payroll Module Notes

## Scope
Phase A payroll implementation per `docs/requirements.md` section 3.5.

## Schema Summary
Migration: `internal/db/migrations/000007_create_payroll_module.up.sql`

### `payroll_batches`
- `id` BIGSERIAL PK
- `month` VARCHAR(7) NOT NULL UNIQUE (`YYYY-MM`)
- `status` VARCHAR(20) NOT NULL CHECK (`Draft`, `Approved`, `Locked`)
- `created_by` BIGINT NOT NULL FK -> `users(id)`
- `created_at` TIMESTAMPTZ NOT NULL default `NOW()`
- `approved_by` BIGINT NULL FK -> `users(id)`
- `approved_at` TIMESTAMPTZ NULL
- `locked_at` TIMESTAMPTZ NULL

### `payroll_entries`
- `id` BIGSERIAL PK
- `batch_id` BIGINT NOT NULL FK -> `payroll_batches(id)`
- `employee_id` BIGINT NOT NULL FK -> `employees(id)`
- `base_salary` NUMERIC(14,2) NOT NULL
- `allowances_total` NUMERIC(14,2) NOT NULL
- `deductions_total` NUMERIC(14,2) NOT NULL
- `tax_total` NUMERIC(14,2) NOT NULL
- `gross_pay` NUMERIC(14,2) NOT NULL
- `net_pay` NUMERIC(14,2) NOT NULL
- `created_at` TIMESTAMPTZ NOT NULL default `NOW()`
- `updated_at` TIMESTAMPTZ NOT NULL default `NOW()`
- Unique key: `(batch_id, employee_id)`
- Indexes: `idx_payroll_entries_batch_id`, `idx_payroll_entries_employee_id`

Down migration: `internal/db/migrations/000007_create_payroll_module.down.sql`

## Wails Binding Signatures
Backend app methods:
- `ListPayrollBatches(request handlers.ListPayrollBatchesRequest) (*payroll.ListBatchesResult, error)`
- `CreatePayrollBatch(request handlers.CreatePayrollBatchRequest) (*payroll.PayrollBatch, error)`
- `GetPayrollBatch(request handlers.GetPayrollBatchRequest) (*payroll.PayrollBatchDetail, error)`
- `GeneratePayrollEntries(request handlers.PayrollBatchActionRequest) error`
- `UpdatePayrollEntryAmounts(request handlers.UpdatePayrollEntryAmountsRequest) (*payroll.PayrollEntry, error)`
- `ApprovePayrollBatch(request handlers.PayrollBatchActionRequest) (*payroll.PayrollBatch, error)`
- `LockPayrollBatch(request handlers.PayrollBatchActionRequest) (*payroll.PayrollBatch, error)`
- `ExportPayrollBatchCSV(request handlers.PayrollBatchActionRequest) (string, error)`

Frontend gateway methods mirror these operations in `frontend/src/lib/wails.ts` and `frontend/src/types/api.ts`.

## Lifecycle Rules
Implemented server-side in `internal/payroll/service.go` and enforced by handler RBAC (`Admin`, `Finance Officer` only):
- Create batch: always starts at `Draft`; duplicate month rejected.
- Generate entries: only when batch is `Draft`.
- Edit entry amounts: only when parent batch is `Draft`.
- Approve: only `Draft -> Approved`, sets `approved_by`, `approved_at`.
- Lock: only `Approved -> Locked`, sets `locked_at`.
- Export CSV: only allowed for `Approved` or `Locked`.

## Regeneration Strategy (Chosen)
Strategy A: **delete existing entries and recreate all entries in one transaction**.

Implementation details:
- `GeneratePayrollEntries` wraps work in `repository.WithTx(...)`.
- Steps inside transaction:
  1. Delete existing entries for the batch.
  2. Fetch all active employees (`employment_status = 'active'`, case-insensitive).
  3. Insert one entry per active employee with default totals.
  4. Persist computed gross/net values server-side.
- Any failure aborts transaction and rolls back all changes.

## Calculation Rules
`internal/payroll/calculation.go`
- `gross_pay = base_salary + allowances_total`
- `net_pay = gross_pay - deductions_total - tax_total`

## Tests
### Backend
- `internal/payroll/calculation_test.go`
- `internal/payroll/service_test.go`
  - transition guards
  - draft-only edit guard
  - transactional rollback simulation on generation failure

Run backend tests:
```bash
GOCACHE=/tmp/go-build GOTMPDIR=/tmp go test ./...
```

### Frontend
Navigation and route smoke tests:
```bash
cd frontend
npm test -- router.test.tsx
npm test
npm run build
```
