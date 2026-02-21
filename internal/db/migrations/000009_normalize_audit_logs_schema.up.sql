CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(150) NOT NULL,
    entity_type VARCHAR(150),
    entity_id BIGINT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN user_id TO actor_user_id;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'entity'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN entity TO entity_type;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE audit_logs RENAME COLUMN details TO metadata;
    END IF;
END $$;

ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS actor_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS entity_type VARCHAR(150),
    ADD COLUMN IF NOT EXISTS entity_id BIGINT,
    ADD COLUMN IF NOT EXISTS metadata JSONB;

ALTER TABLE audit_logs ALTER COLUMN action SET NOT NULL;
ALTER TABLE audit_logs ALTER COLUMN entity_type DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

DROP INDEX IF EXISTS idx_audit_logs_user_id;
