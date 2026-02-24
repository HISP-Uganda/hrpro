DROP INDEX IF EXISTS idx_employees_phone_e164;

ALTER TABLE employees
    DROP COLUMN IF EXISTS phone_e164,
    DROP COLUMN IF EXISTS contract_file_path,
    DROP COLUMN IF EXISTS contract_url,
    DROP COLUMN IF EXISTS job_description;
