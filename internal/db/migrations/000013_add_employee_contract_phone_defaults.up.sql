ALTER TABLE employees
    ADD COLUMN IF NOT EXISTS job_description TEXT,
    ADD COLUMN IF NOT EXISTS contract_url TEXT,
    ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
    ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(32);

UPDATE employees
SET phone_e164 = phone
WHERE phone_e164 IS NULL
  AND phone IS NOT NULL
  AND phone ~ '^\+[1-9][0-9]{6,14}$';

CREATE INDEX IF NOT EXISTS idx_employees_phone_e164 ON employees (phone_e164);
