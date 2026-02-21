CREATE INDEX IF NOT EXISTS idx_leave_requests_status_approved_at
    ON leave_requests (status, approved_at);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status_date_range
    ON leave_requests (status, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_payroll_batches_month_desc
    ON payroll_batches (month DESC);
