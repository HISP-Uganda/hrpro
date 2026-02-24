ALTER TABLE employees
    DROP CONSTRAINT IF EXISTS employees_gender_check;

ALTER TABLE employees
    ALTER COLUMN gender DROP NOT NULL,
    ALTER COLUMN gender TYPE VARCHAR(30);
