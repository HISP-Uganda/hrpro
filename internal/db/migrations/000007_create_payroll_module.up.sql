CREATE TABLE IF NOT EXISTS payroll_batches (
    id BIGSERIAL PRIMARY KEY,
    month VARCHAR(7) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    CONSTRAINT chk_payroll_batches_month_format CHECK (month ~ '^\\d{4}-\\d{2}$'),
    CONSTRAINT chk_payroll_batches_status CHECK (status IN ('Draft', 'Approved', 'Locked'))
);

CREATE TABLE IF NOT EXISTS payroll_entries (
    id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    base_salary NUMERIC(14,2) NOT NULL DEFAULT 0,
    allowances_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    deductions_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    tax_total NUMERIC(14,2) NOT NULL DEFAULT 0,
    gross_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_pay NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_payroll_entries_batch_employee UNIQUE (batch_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_entries_batch_id ON payroll_entries(batch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_entries_employee_id ON payroll_entries(employee_id);
