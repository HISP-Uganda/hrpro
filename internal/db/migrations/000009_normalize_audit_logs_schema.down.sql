DROP INDEX IF EXISTS idx_audit_logs_action;
DROP INDEX IF EXISTS idx_audit_logs_actor_user_id;

UPDATE audit_logs SET entity_type = 'unknown' WHERE entity_type IS NULL;
ALTER TABLE audit_logs ALTER COLUMN entity_type SET NOT NULL;

ALTER TABLE audit_logs DROP COLUMN IF EXISTS entity_id;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'actor_user_id'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN actor_user_id TO user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'entity_type'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN entity_type TO entity;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN metadata TO details;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
