UPDATE employees
SET gender = 'Male'
WHERE gender IS NULL;

UPDATE employees
SET gender = CASE
    WHEN lower(trim(gender)) = 'male' THEN 'Male'
    WHEN lower(trim(gender)) = 'female' THEN 'Female'
    ELSE 'Male'
END
WHERE gender IS NOT NULL;

ALTER TABLE employees
    ALTER COLUMN gender TYPE VARCHAR(10),
    ALTER COLUMN gender SET NOT NULL;

ALTER TABLE employees
    ADD CONSTRAINT employees_gender_check CHECK (gender IN ('Male', 'Female'));
