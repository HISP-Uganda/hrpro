ALTER TABLE employees DROP CONSTRAINT IF EXISTS fk_employees_department_id;
DROP INDEX IF EXISTS uq_departments_name_lower;
DROP TABLE IF EXISTS departments;
