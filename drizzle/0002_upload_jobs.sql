CREATE TABLE IF NOT EXISTS upload_jobs (
  id uuid PRIMARY KEY,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  blob_pathname text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('created', 'uploaded', 'sending', 'sent', 'failed')),
  attempts integer NOT NULL DEFAULT 0,
  telegram_message_id integer,
  delivery_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS upload_jobs_status_expires_at_idx
  ON upload_jobs (status, expires_at);