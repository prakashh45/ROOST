-- ═══════════════════════════════════════════════════════════════════════════
-- ROOST Backend — Migration 0002: New Modules
-- Run this SQL against your PostgreSQL database BEFORE running prisma generate
-- ═══════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Update users role constraint to allow MANAGER and RECEPTIONIST
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_role;
ALTER TABLE users ADD CONSTRAINT chk_users_role
  CHECK (role IN ('GUEST','OWNER','STAFF','PLATFORM_ADMIN','MANAGER','RECEPTIONIST'));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Add check-in/check-out columns to bookings
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_in  TIMESTAMP(6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_check_out TIMESTAMP(6);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_in_by    BIGINT REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checked_out_by   BIGINT REFERENCES users(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_status   VARCHAR(30) DEFAULT 'UNPAID';

-- Update bookings status constraint to allow CHECKED_IN
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_bookings_status;
ALTER TABLE bookings ADD CONSTRAINT chk_bookings_status
  CHECK (status IN ('PENDING','CONFIRMED','REJECTED','CANCELLED','CHECKED_IN','COMPLETED'));

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Guest profiles (extends users table for physical check-in data)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS guest_profiles (
  id                     BIGSERIAL    PRIMARY KEY,
  tenant_id              BIGINT       NOT NULL REFERENCES tenants(id),
  user_id                BIGINT       NOT NULL REFERENCES users(id),
  id_proof_type          VARCHAR(50),
  id_proof_number        VARCHAR(100),
  address                TEXT,
  city                   VARCHAR(100),
  state                  VARCHAR(100),
  nationality            VARCHAR(50)  DEFAULT 'Indian',
  gender                 VARCHAR(10),
  date_of_birth          DATE,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  notes                  TEXT,
  created_at             TIMESTAMP(6) DEFAULT NOW(),
  updated_at             TIMESTAMP(6) DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_tenant  ON guest_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_guest_profiles_user    ON guest_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_guest_profiles_tenant_user ON guest_profiles(tenant_id, user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Payments
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              BIGSERIAL      PRIMARY KEY,
  tenant_id       BIGINT         NOT NULL REFERENCES tenants(id),
  booking_id      BIGINT         NOT NULL REFERENCES bookings(id),
  payment_code    VARCHAR(50)    UNIQUE NOT NULL,
  amount          DECIMAL(12,2)  NOT NULL,
  method          VARCHAR(30)    NOT NULL DEFAULT 'CASH',
  status          VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
  received_by     BIGINT         REFERENCES users(id),
  transaction_ref VARCHAR(255),
  notes           TEXT,
  paid_at         TIMESTAMP(6),
  created_at      TIMESTAMP(6)   DEFAULT NOW(),
  updated_at      TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_tenant  ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status  ON payments(status);

ALTER TABLE payments ADD CONSTRAINT chk_payments_method
  CHECK (method IN ('CASH','UPI','CARD','BANK_TRANSFER','ONLINE'));
ALTER TABLE payments ADD CONSTRAINT chk_payments_status
  CHECK (status IN ('PENDING','COMPLETED','FAILED','REFUNDED'));

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Invoices
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              BIGSERIAL      PRIMARY KEY,
  tenant_id       BIGINT         NOT NULL REFERENCES tenants(id),
  booking_id      BIGINT         NOT NULL REFERENCES bookings(id),
  payment_id      BIGINT         REFERENCES payments(id),
  invoice_number  VARCHAR(50)    UNIQUE NOT NULL,
  subtotal        DECIMAL(12,2)  NOT NULL,
  tax_amount      DECIMAL(12,2)  DEFAULT 0,
  total_amount    DECIMAL(12,2)  NOT NULL,
  status          VARCHAR(30)    DEFAULT 'DRAFT',
  issued_at       TIMESTAMP(6),
  created_at      TIMESTAMP(6)   DEFAULT NOW(),
  updated_at      TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant  ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(booking_id);

ALTER TABLE invoices ADD CONSTRAINT chk_invoices_status
  CHECK (status IN ('DRAFT','ISSUED','PAID','CANCELLED'));

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Refunds
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refunds (
  id              BIGSERIAL      PRIMARY KEY,
  tenant_id       BIGINT         NOT NULL REFERENCES tenants(id),
  payment_id      BIGINT         NOT NULL REFERENCES payments(id),
  booking_id      BIGINT         NOT NULL REFERENCES bookings(id),
  refund_code     VARCHAR(50)    UNIQUE NOT NULL,
  amount          DECIMAL(12,2)  NOT NULL,
  reason          TEXT           NOT NULL,
  status          VARCHAR(30)    DEFAULT 'PENDING',
  approved_by     BIGINT         REFERENCES users(id),
  processed_at    TIMESTAMP(6),
  created_at      TIMESTAMP(6)   DEFAULT NOW(),
  updated_at      TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant  ON refunds(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON refunds(payment_id);

ALTER TABLE refunds ADD CONSTRAINT chk_refunds_status
  CHECK (status IN ('PENDING','APPROVED','REJECTED','PROCESSED'));

-- ────────────────────────────────────────────────────────────────────────────
-- 7. Feedback
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedback (
  id                  BIGSERIAL      PRIMARY KEY,
  tenant_id           BIGINT         NOT NULL REFERENCES tenants(id),
  booking_id          BIGINT         REFERENCES bookings(id),
  guest_id            BIGINT         NOT NULL REFERENCES users(id),
  overall_rating      INT            NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating  INT            CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  service_rating      INT            CHECK (service_rating >= 1 AND service_rating <= 5),
  value_rating        INT            CHECK (value_rating >= 1 AND value_rating <= 5),
  comment             TEXT,
  status              VARCHAR(30)    DEFAULT 'NEW',
  reviewed_by         BIGINT         REFERENCES users(id),
  created_at          TIMESTAMP(6)   DEFAULT NOW(),
  updated_at          TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_feedback_tenant  ON feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feedback_booking ON feedback(booking_id);
CREATE INDEX IF NOT EXISTS idx_feedback_guest   ON feedback(guest_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 8. Complaints
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS complaints (
  id              BIGSERIAL      PRIMARY KEY,
  tenant_id       BIGINT         NOT NULL REFERENCES tenants(id),
  booking_id      BIGINT         REFERENCES bookings(id),
  guest_id        BIGINT         NOT NULL REFERENCES users(id),
  complaint_code  VARCHAR(50)    UNIQUE NOT NULL,
  category        VARCHAR(50),
  subject         VARCHAR(255)   NOT NULL,
  description     TEXT           NOT NULL,
  priority        VARCHAR(20)    DEFAULT 'MEDIUM',
  status          VARCHAR(30)    DEFAULT 'OPEN',
  assigned_to     BIGINT         REFERENCES users(id),
  resolution      TEXT,
  resolved_at     TIMESTAMP(6),
  created_at      TIMESTAMP(6)   DEFAULT NOW(),
  updated_at      TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_complaints_tenant   ON complaints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status   ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);

ALTER TABLE complaints ADD CONSTRAINT chk_complaints_priority
  CHECK (priority IN ('LOW','MEDIUM','HIGH','URGENT'));
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_status
  CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED'));
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_category
  CHECK (category IN ('CLEANLINESS','NOISE','MAINTENANCE','SERVICE','FOOD','SAFETY','OTHER'));

-- ────────────────────────────────────────────────────────────────────────────
-- 9. Audit Logs
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL      PRIMARY KEY,
  tenant_id   BIGINT         REFERENCES tenants(id),
  user_id     BIGINT         REFERENCES users(id),
  action      VARCHAR(100)   NOT NULL,
  entity_type VARCHAR(50)    NOT NULL,
  entity_id   VARCHAR(50),
  old_values  JSONB,
  new_values  JSONB,
  ip_address  VARCHAR(45),
  user_agent  TEXT,
  created_at  TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant  ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ────────────────────────────────────────────────────────────────────────────
-- 10. Inventory Items
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id              BIGSERIAL      PRIMARY KEY,
  tenant_id       BIGINT         NOT NULL REFERENCES tenants(id),
  property_id     BIGINT         NOT NULL REFERENCES properties(id),
  name            VARCHAR(255)   NOT NULL,
  category        VARCHAR(30)    NOT NULL DEFAULT 'NON_RECURRING',
  unit            VARCHAR(30)    DEFAULT 'PIECE',
  current_stock   DECIMAL(12,2)  DEFAULT 0,
  min_stock_level DECIMAL(12,2)  DEFAULT 0,
  cost_per_unit   DECIMAL(12,2),
  status          VARCHAR(30)    DEFAULT 'ACTIVE',
  created_at      TIMESTAMP(6)   DEFAULT NOW(),
  updated_at      TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_items_tenant   ON inventory_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_property ON inventory_items(property_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_inventory_items_tenant_property_name
  ON inventory_items(tenant_id, property_id, name);

ALTER TABLE inventory_items ADD CONSTRAINT chk_inventory_category
  CHECK (category IN ('RECURRING','NON_RECURRING'));

-- ────────────────────────────────────────────────────────────────────────────
-- 11. Inventory Transactions
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id            BIGSERIAL      PRIMARY KEY,
  tenant_id     BIGINT         NOT NULL REFERENCES tenants(id),
  item_id       BIGINT         NOT NULL REFERENCES inventory_items(id),
  type          VARCHAR(20)    NOT NULL,
  quantity      DECIMAL(12,2)  NOT NULL,
  notes         TEXT,
  performed_by  BIGINT         NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_tenant ON inventory_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_tx_item   ON inventory_transactions(item_id);

ALTER TABLE inventory_transactions ADD CONSTRAINT chk_inventory_tx_type
  CHECK (type IN ('IN','OUT','ADJUSTMENT'));

-- ────────────────────────────────────────────────────────────────────────────
-- 12. System Settings
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  id            BIGSERIAL      PRIMARY KEY,
  tenant_id     BIGINT         REFERENCES tenants(id),
  setting_key   VARCHAR(100)   NOT NULL,
  setting_value TEXT,
  category      VARCHAR(50)    DEFAULT 'GENERAL',
  description   TEXT,
  created_at    TIMESTAMP(6)   DEFAULT NOW(),
  updated_at    TIMESTAMP(6)   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_system_settings_tenant   ON system_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE UNIQUE INDEX IF NOT EXISTS uq_system_settings_tenant_key
  ON system_settings(COALESCE(tenant_id, 0), setting_key);

-- ────────────────────────────────────────────────────────────────────────────
-- 13. Insert default system settings
-- ────────────────────────────────────────────────────────────────────────────
INSERT INTO system_settings (tenant_id, setting_key, setting_value, category, description) VALUES
  (NULL, 'default_language',     'en',    'LANGUAGE',  'Default system language (en/hi/mr)'),
  (NULL, 'supported_languages',  'en,hi,mr', 'LANGUAGE', 'Supported languages: English, Hindi, Marathi'),
  (NULL, 'default_timezone',     'Asia/Kolkata', 'GENERAL', 'Default timezone'),
  (NULL, 'default_currency',     'INR',   'GENERAL',   'Default currency'),
  (NULL, 'default_bed_count',    '46',    'GENERAL',   'Total default bed count'),
  (NULL, 'ac_bed_count',         '20',    'GENERAL',   'AC beds — Super Deluxe'),
  (NULL, 'non_ac_bed_count',     '26',    'GENERAL',   'Non-AC beds — Deluxe'),
  (NULL, 'backup_enabled',       'false', 'BACKUP',    'Automatic backup enabled'),
  (NULL, 'backup_frequency',     'daily', 'BACKUP',    'Backup frequency'),
  (NULL, 'camera_enabled',       'false', 'CAMERA',    'Camera integration enabled')
ON CONFLICT DO NOTHING;
