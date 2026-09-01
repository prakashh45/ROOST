CREATE TABLE IF NOT EXISTS cameras (
  id         BIGSERIAL PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  location   VARCHAR(255) NOT NULL,
  status     VARCHAR(30) NOT NULL DEFAULT 'ONLINE',
  stream_url VARCHAR(2048),
  created_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_cameras_status CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE'))
);

CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
