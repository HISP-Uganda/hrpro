CREATE TABLE IF NOT EXISTS leave_types (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    paid BOOLEAN NOT NULL DEFAULT TRUE,
    counts_toward_entitlement BOOLEAN NOT NULL DEFAULT TRUE,
    requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
    requires_approval BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_entitlements (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    reserved_days NUMERIC(8,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_leave_entitlements_employee_year UNIQUE (employee_id, year),
    CONSTRAINT chk_leave_entitlements_total_non_negative CHECK (total_days >= 0),
    CONSTRAINT chk_leave_entitlements_reserved_non_negative CHECK (reserved_days >= 0),
    CONSTRAINT chk_leave_entitlements_reserved_not_above_total CHECK (reserved_days <= total_days)
);

CREATE TABLE IF NOT EXISTS leave_locked_dates (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    reason TEXT,
    created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    leave_type_id BIGINT NOT NULL REFERENCES leave_types(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    working_days NUMERIC(8,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    reason TEXT,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_leave_requests_status CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    CONSTRAINT chk_leave_requests_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_leave_requests_working_days_positive CHECK (working_days > 0)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_date_range ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_entitlements_employee_year ON leave_entitlements(employee_id, year);

INSERT INTO leave_types (name, paid, counts_toward_entitlement, requires_attachment, requires_approval, active)
VALUES
    ('Annual Leave', TRUE, TRUE, FALSE, TRUE, TRUE),
    ('Sick Leave', TRUE, TRUE, FALSE, TRUE, TRUE),
    ('Maternity Leave', TRUE, TRUE, FALSE, TRUE, TRUE),
    ('Unpaid Leave', FALSE, FALSE, FALSE, TRUE, TRUE)
ON CONFLICT (name) DO NOTHING;
