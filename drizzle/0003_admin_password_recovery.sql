CREATE TABLE IF NOT EXISTS admin_credentials (
  id smallint PRIMARY KEY CHECK (id = 1),
  password_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_recovery_state (
  id smallint PRIMARY KEY CHECK (id = 1),
  failed_attempts integer NOT NULL DEFAULT 0 CHECK (failed_attempts >= 0),
  recovery_code_hash text,
  recovery_expires_at timestamptz,
  recovery_attempts integer NOT NULL DEFAULT 0 CHECK (recovery_attempts >= 0),
  last_code_sent_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO admin_recovery_state (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;