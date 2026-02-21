CREATE TABLE IF NOT EXISTS attendance_records (
    id BIGSERIAL PRIMARY KEY,
    attendance_date DATE NOT NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    status TEXT NOT NULL,
    marked_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_locked BOOLEAN NOT NULL DEFAULT TRUE,
    lock_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attendance_records_date_employee UNIQUE (attendance_date, employee_id),
    CONSTRAINT chk_attendance_records_status CHECK (status IN ('present', 'late', 'field', 'absent', 'leave'))
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_attendance_date ON attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

CREATE TABLE IF NOT EXISTS lunch_catering_daily (
    attendance_date DATE PRIMARY KEY,
    visitors_count INT NOT NULL DEFAULT 0,
    plate_cost_amount INT NOT NULL DEFAULT 12000,
    staff_contribution_amount INT NOT NULL DEFAULT 4000,
    updated_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_lunch_catering_daily_visitors_count_non_negative CHECK (visitors_count >= 0),
    CONSTRAINT chk_lunch_catering_daily_plate_cost_positive CHECK (plate_cost_amount > 0),
    CONSTRAINT chk_lunch_catering_daily_staff_contribution_non_negative CHECK (staff_contribution_amount >= 0)
);
