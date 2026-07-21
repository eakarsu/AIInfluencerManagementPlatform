ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_hash TEXT;
UPDATE users SET password_hash = password WHERE password_hash IS NULL;
