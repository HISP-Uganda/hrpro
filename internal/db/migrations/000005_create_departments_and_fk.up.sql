CREATE TABLE IF NOT EXISTS departments (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_name_lower ON departments (LOWER(name));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_employees_department_id'
    ) THEN
        ALTER TABLE employees
        ADD CONSTRAINT fk_employees_department_id
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE RESTRICT;
    END IF;
END $$;
