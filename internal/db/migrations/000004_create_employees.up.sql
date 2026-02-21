CREATE TABLE IF NOT EXISTS employees (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    other_name VARCHAR(100),
    gender VARCHAR(30),
    dob DATE,
    phone VARCHAR(40),
    email VARCHAR(255),
    national_id VARCHAR(100),
    address TEXT,
    department_id BIGINT,
    position VARCHAR(120) NOT NULL,
    employment_status VARCHAR(60) NOT NULL,
    date_of_hire DATE NOT NULL,
    base_salary_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_name ON employees (lower(first_name), lower(last_name));
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees (employment_status);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees (department_id);
