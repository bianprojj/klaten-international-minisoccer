-- ==================== DROP EXISTING TABLES ====================
-- Drop tables dalam urutan reverse dependencies
DROP VIEW IF EXISTS field_availability CASCADE;
DROP VIEW IF EXISTS daily_revenue CASCADE;
DROP VIEW IF EXISTS guest_booking_history CASCADE;

DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS payment CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS field_schedule CASCADE;
DROP TABLE IF EXISTS admin_setting CASCADE;
DROP TABLE IF EXISTS admin_session CASCADE;
DROP TABLE IF EXISTS admin_user CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS field CASCADE;
DROP TABLE IF EXISTS venue_feature CASCADE;
DROP TABLE IF EXISTS venue_gallery CASCADE;
DROP TABLE IF EXISTS schedule_slot CASCADE;
DROP TABLE IF EXISTS webhook_event CASCADE;

-- NOTE: `field` table removed per request — application will treat the system
-- as a single-venue setup. Bookings no longer reference `field_id`.

-- Prisma migrations table (kept to reflect Supabase _prisma_migrations)
CREATE TABLE IF NOT EXISTS _prisma_migrations (
  id varchar PRIMARY KEY,
  checksum varchar NOT NULL,
  finished_at timestamptz,
  migration_name varchar NOT NULL,
  logs text,
  rolled_back_at timestamptz,
  started_at timestamptz NOT NULL,
  applied_steps_count int4 NOT NULL
);

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- NOTE: `field_schedule` removed. Availability is derived from `booking` and `payment` statuses.

-- ==================== BOOKING (GUEST ONLY) ====================
CREATE TABLE booking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Booking details (single-venue system: no field_id)
  booking_date DATE NOT NULL,
  start_time VARCHAR(10) NOT NULL, -- HH:mm format
  end_time VARCHAR(10) NOT NULL, -- HH:mm format
  duration_hours INTEGER NOT NULL, -- Number of hours
  total_price INTEGER NOT NULL, -- Total price in IDR

  -- Customer info (guest only - no login required)
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent double-booking for same slot (single venue)
  UNIQUE (booking_date, start_time)
);

CREATE TABLE schedule_slot (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time VARCHAR(10) NOT NULL,
  end_time VARCHAR(10) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  day_of_week VARCHAR(50) DEFAULT 'mon,tue,wed,thu,fri,sat,sun',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_schedule_slot_sort_order ON schedule_slot(sort_order);

-- Untuk DB yang sudah ada (JANGAN run ulang file ini): jalankan blok ini saja
-- ALTER TABLE schedule_slot ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(50) DEFAULT 'mon,tue,wed,thu,fri,sat,sun';
-- UPDATE schedule_slot SET day_of_week = 'mon,tue,wed,thu,fri,sat,sun' WHERE day_of_week IS NULL;

INSERT INTO schedule_slot (id, start_time, end_time, is_active, sort_order, price, day_of_week, created_at, updated_at)
VALUES
  (gen_random_uuid(), '07:00', '08:00', true, 0, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '08:00', '09:00', true, 1, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '09:00', '10:00', true, 2, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '10:00', '11:00', true, 3, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '11:00', '12:00', true, 4, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '12:00', '13:00', true, 5, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '13:00', '14:00', true, 6, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '14:00', '15:00', true, 7, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '15:00', '16:00', true, 8, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '16:00', '17:00', true, 9, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '17:00', '18:00', true, 10, 110000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '18:00', '19:00', true, 11, 150000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '19:00', '20:00', true, 12, 150000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '20:00', '21:00', true, 13, 150000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '21:00', '22:00', true, 14, 120000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW()),
  (gen_random_uuid(), '22:00', '23:00', true, 15, 120000, 'mon,tue,wed,thu,fri,sat,sun', NOW(), NOW());

-- ==================== PAYMENT & TRANSACTION (MIDTRANS) ====================
CREATE TABLE payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  
  -- Transaction details
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  midtrans_order_id VARCHAR(255) UNIQUE,
  snap_token VARCHAR(512),
  payment_link_url TEXT,
  amount INTEGER NOT NULL, -- Amount in IDR
  payment_method VARCHAR(100) DEFAULT 'Midtrans', -- Payment method used
  provider VARCHAR(100) DEFAULT 'Midtrans', -- Payment provider
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, success, failed, cancelled, refunded
  
  -- Timestamps
  paid_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== WEBHOOK EVENT LOG ====================
CREATE TABLE webhook_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash VARCHAR(255) UNIQUE NOT NULL,
  order_id VARCHAR(255),
  event_type VARCHAR(100),
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_event_order_id ON webhook_event(order_id);
CREATE INDEX IF NOT EXISTS idx_webhook_event_processed ON webhook_event(processed);

-- ==================== INVOICE & RECEIPT ====================
CREATE TABLE invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  booking_id UUID UNIQUE NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  payment_id UUID UNIQUE NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
  
  -- Customer details for verification and pickup
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  
  -- Invoice details
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'issued', -- issued, paid, cancelled
  
  -- Timestamps
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== REVIEW & RATING ====================
CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES booking(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== ADMIN SETTINGS ====================
CREATE TABLE admin_setting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== RBAC ADMIN USERS ====================
CREATE TABLE admin_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'staff',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  password_changed_at TIMESTAMP,
  must_change_password BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tambahan untuk DB yang SUDAH dibuat dari versi lama file ini (jalankan blok ini saja,
-- JANGAN run ulang seluruh file karena berisi DROP TABLE yang menghapus data):
-- ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;
-- ALTER TABLE admin_user ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false;

CREATE TABLE admin_session (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES admin_user(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== VENUE FEATURES ====================
-- Facility cards shown on the homepage. Images are stored in Cloudinary;
-- only the secure URL and public ID are stored in PostgreSQL.
CREATE TABLE venue_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venue_feature_active_order ON venue_feature(is_active, sort_order);

-- ==================== VENUE GALLERY ====================
-- Multiple angles of the single venue shown in the landing-page carousel.
CREATE TABLE venue_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(150) NOT NULL,
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venue_gallery_active_order ON venue_gallery(is_active, sort_order);

INSERT INTO venue_gallery (title, image_url, image_public_id, sort_order, is_active)
VALUES
  ('Lapangan premium', 'https://res.cloudinary.com/l2qucbfo/image/upload/v1789718224/Lapangan_premium.webp', 'lapangan_premium_aqejyy', 0, true),
  ('Lampu malam', 'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195023/Lampu_Malam.webp', 'lampu_malam_xntenr', 1, true),
  ('Fasilitas sewa', 'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195023/Fasilitas.webp', 'fasilitas_sewa_o0uptk', 2, true),
  ('Citarasa komunitas', 'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195024/Komunitas.webp', 'citarasa_komunitas_ey2pmm', 3, true);

-- Initial venue features. Images are stored in Cloudinary; only URLs and IDs are stored here.
INSERT INTO venue_feature
  (name, description, image_url, image_public_id, sort_order, is_active)
VALUES
  (
    'Lapangan premium',
    'Surface terbaik untuk 5v5 dan mini soccer.',
    'https://res.cloudinary.com/l2qucbfo/image/upload/v1789718224/Lapangan_premium.webp',
    'lapangan_premium_aqejyy',
    0,
    true
  ),
  (
    'Lampu malam',
    'Jadwal per jam hingga malam hari.',
    'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195023/Lampu_Malam.webp',
    'lampu_malam_xntenr',
    1,
    true
  ),
  (
    'Fasilitas sewa',
    'Loker, sepatu, bola, dan ruang ganti yang tertata rapi.',
    'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195023/Fasilitas.webp',
    'fasilitas_sewa_o0uptk',
    2,
    true
  ),
  (
    'Citarasa komunitas',
    'Tempat berkumpul dan pertandingan seru.',
    'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195024/Komunitas.webp',
    'citarasa_komunitas_ey2pmm',
    3,
    true
  );

-- ==================== AUDIT LOG ====================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  action VARCHAR(100) NOT NULL, -- booking_created, payment_made, etc
  entity VARCHAR(100) NOT NULL, -- Booking, Payment, etc
  entity_id VARCHAR(255) NOT NULL,
  changes TEXT, -- JSON string of what changed
  ip_address VARCHAR(45),
  reference_email VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==================== CREATE INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_booking_customer_email ON booking(customer_email);
CREATE INDEX IF NOT EXISTS idx_booking_customer_phone ON booking(customer_phone);
CREATE INDEX IF NOT EXISTS idx_booking_booking_date ON booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_status ON booking(status);

-- ==================== TIMEZONE NORMALIZATION (JAKARTA WIB) ====================
-- NOTE: Safe to run manually on existing data. This keeps booking_date aligned with Jakarta timezone.
-- Run this after table creation or whenever legacy records appear shifted by UTC.
-- ==================== TIMEZONE NORMALIZATION (JAKARTA WIB) ====================
-- This section provides safe preview queries and two "apply" options depending on
-- the actual column type of `booking.booking_date` in your database.
-- IMPORTANT: Inspect the preview results first. Run only the UPDATE that matches
-- your column type. If `booking_date` is a DATE (no time component) you do NOT
-- need timezone normalization.

-- 1) Preview helper: show current value and candidate normalized value (first 50 rows)
SELECT id,
       booking_date AS current_value,
       -- Interpret as timestamptz -> convert to Asia/Jakarta local timestamp for preview
       ((booking_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::timestamp AS preview_jakarta
FROM booking
WHERE booking_date IS NOT NULL
LIMIT 50;

-- 2) If `booking_date` column is of type TIMESTAMP WITH TIME ZONE (timestamptz)
--    and values were stored/interpreted as UTC but should represent Jakarta local time,
--    you can run the following UPDATE to rewrite stored values to Jakarta-local timestamps
--    (this stores a TIMESTAMP WITHOUT TIME ZONE representing the local wall-clock time):
-- UPDATE booking
-- SET booking_date = ((booking_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::timestamp
-- WHERE booking_date IS NOT NULL;

-- 3) If `booking_date` column is of type TIMESTAMP WITHOUT TIME ZONE and values
--    were recorded as if they were UTC but intended to be Jakarta-local instants,
--    run the following (preview first):
-- SELECT id, booking_date,
--        ((booking_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::timestamp AS preview_jakarta
-- FROM booking LIMIT 50;
-- Then apply:
-- UPDATE booking
-- SET booking_date = ((booking_date AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Jakarta')::timestamp
-- WHERE booking_date IS NOT NULL;

-- 4) If `booking_date` is of type DATE (no time), no timezone adjustment is necessary.
--    If you instead need to migrate from timestamp columns to date-only values, handle
--    that explicitly using date-truncation functions.

-- NOTE: The queries above are intentionally explicit and commented for safety.
-- Remove the leading `-- ` from the chosen UPDATE when you are ready to apply it.

CREATE INDEX IF NOT EXISTS idx_review_booking_id ON review(booking_id);
CREATE INDEX IF NOT EXISTS idx_admin_setting_key ON admin_setting(key);
CREATE INDEX IF NOT EXISTS idx_admin_user_email ON admin_user(email);
CREATE INDEX IF NOT EXISTS idx_admin_user_role ON admin_user(role);
CREATE INDEX IF NOT EXISTS idx_admin_session_user_id ON admin_session(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_session_token_hash ON admin_session(token_hash);

CREATE INDEX IF NOT EXISTS idx_payment_booking_id ON payment(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transaction_id ON payment(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON payment(status);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON payment(created_at);

CREATE INDEX IF NOT EXISTS idx_invoice_booking_id ON invoice(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payment_id ON invoice(payment_id);
CREATE INDEX IF NOT EXISTS idx_invoice_status ON invoice(status);

-- Field-related indexes removed because `field` and `field_schedule` are dropped.
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);

-- Schedules are derived from `booking`/`payment` records in this schema; no pre-seeded field_schedule.

INSERT INTO booking (id, booking_date, start_time, end_time, duration_hours, total_price, customer_name, customer_phone, customer_email, status)
VALUES
  ('660e8400-e29b-41d4-a716-446655440000', CURRENT_DATE + 1, '18:00', '20:00', 2, 500000, 'Ahmad Rahman', '08123456789', 'ahmad@email.com', 'confirmed'),
  ('660e8400-e29b-41d4-a716-446655440001', CURRENT_DATE + 1, '19:00', '21:00', 2, 400000, 'Budi Santoso', '08987654321', 'budi@email.com', 'pending'),
  ('660e8400-e29b-41d4-a716-446655440002', CURRENT_DATE + 2, '17:00', '19:00', 2, 500000, 'Citra Dewi', '08765432109', 'citra@email.com', 'confirmed');

-- Insert sample payments (Midtrans)
INSERT INTO payment (id, booking_id, transaction_id, amount, payment_method, provider, status, paid_at, created_at)
VALUES
  ('770e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 500000, 'Midtrans', 'Midtrans', 'success', NOW(), NOW()),
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 400000, 'Midtrans', 'Midtrans', 'pending', NULL, NOW()),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 500000, 'Midtrans', 'Midtrans', 'success', NOW(), NOW());

-- Insert sample invoices
INSERT INTO invoice (id, invoice_number, booking_id, payment_id, subtotal, tax, discount, total, status, paid_at, created_at)
VALUES
  ('880e8400-e29b-41d4-a716-446655440000', 'INV-20260720-001', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000', 500000, 0, 0, 500000, 'paid', NOW(), NOW()),
  ('880e8400-e29b-41d4-a716-446655440001', 'INV-20260720-002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 400000, 0, 0, 400000, 'issued', NULL, NOW()),
  ('880e8400-e29b-41d4-a716-446655440002', 'INV-20260720-003', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', 500000, 0, 0, 500000, 'paid', NOW(), NOW());

-- Insert review data
INSERT INTO review (id, booking_id, customer_name, rating, comment, created_at, updated_at)
VALUES
  ('a70e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'Ahmad Rahman', 5, 'Lapangan bersih, proses booking cepat, dan pelayanan ramah.', NOW(), NOW()),
  ('a70e8400-e29b-41d4-a716-446655440001', NULL, 'Nina Sari', 4, 'Fasilitas bagus dan suasana nyaman. Parkir bisa ditingkatkan.', NOW(), NOW()),
  ('a70e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Bima Kusuma', 5, 'Cocok untuk latihan tim kecil, booking mudah dan transparan.', NOW(), NOW());

-- Insert admin settings
INSERT INTO admin_setting (id, key, value, description, created_at, updated_at)
VALUES
  ('b80e8400-e29b-41d4-a716-446655440000', 'site_title', 'Klaten International Minisoccer', 'Nama utama situs web', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440001', 'contact_email', 'admin@dev.klatenminisoccer.web.id', 'Email kontak utama', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440002', 'contact_phone', '+62 857 744 40016', 'Nomor telepon kontak utama', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440003', 'locationLabel', 'KLATEN INTERNATIONAL MINISOCCER', 'Label lokasi pada hero website', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440004', 'heroTitle', 'Klaten International Minisoccer', 'Judul utama website', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440005', 'heroSubtitle', 'Satu lapangan premium dengan jadwal per jam, booking mudah, dan suasana lapangan terbaik untuk komunitas futsal dan mini soccer.', 'Deskripsi utama website', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440006', 'ctaPrimary', 'Pesan sekarang', 'Teks tombol booking utama', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440007', 'ctaSecondary', 'Lihat riwayat booking', 'Teks tombol riwayat booking', NOW(), NOW()),
  ('b80e8400-e29b-41d4-a716-446655440008', 'backgroundImageUrl', 'https://res.cloudinary.com/l2qucbfo/image/upload/v1789195023/Utama.webp', 'Background utama hero website', NOW(), NOW());

-- Insert mock RBAC admin accounts (1 staff, 2 manager, 3 super_admin)
-- Password: legacy SHA256 dihitung Postgres via encode(digest(...)). JANGAN hardcode hex manual.
-- Login pertama akan auto-upgrade ke bcrypt (lihat lib/admin-auth.ts).
-- staff@... = staff123 | manager1/2@... = manager123 | superadmin1/2/3@... = superadmin123
INSERT INTO admin_user (id, name, email, password_hash, role, is_active, last_login_at, created_at, updated_at)
VALUES
  ('c90e8400-e29b-41d4-a716-446655440000', 'Staff Operator', 'staff@klatenminisoccer.id', encode(digest('staff123', 'sha256'), 'hex'), 'staff', true, NULL, NOW(), NOW()),
  ('c90e8400-e29b-41d4-a716-446655440001', 'Manager One', 'manager1@klatenminisoccer.id', encode(digest('manager123', 'sha256'), 'hex'), 'manager', true, NULL, NOW(), NOW()),
  ('c90e8400-e29b-41d4-a716-446655440002', 'Manager Two', 'manager2@klatenminisoccer.id', encode(digest('manager123', 'sha256'), 'hex'), 'manager', true, NULL, NOW(), NOW()),
  ('c90e8400-e29b-41d4-a716-446655440003', 'Super Admin One', 'superadmin1@klatenminisoccer.id', encode(digest('superadmin123', 'sha256'), 'hex'), 'super_admin', true, NULL, NOW(), NOW()),
  ('c90e8400-e29b-41d4-a716-446655440004', 'Super Admin Two', 'superadmin2@klatenminisoccer.id', encode(digest('superadmin123', 'sha256'), 'hex'), 'super_admin', true, NULL, NOW(), NOW()),
  ('c90e8400-e29b-41d4-a716-446655440005', 'Super Admin Three', 'superadmin3@klatenminisoccer.id', encode(digest('superadmin123', 'sha256'), 'hex'), 'super_admin', true, NULL, NOW(), NOW());

-- Insert audit logs
INSERT INTO audit_log (id, action, entity, entity_id, changes, reference_email, created_at)
VALUES
  ('990e8400-e29b-41d4-a716-446655440000', 'booking_created', 'Booking', '660e8400-e29b-41d4-a716-446655440000', NULL, 'ahmad@email.com', NOW()),
  ('990e8400-e29b-41d4-a716-446655440001', 'payment_made', 'Payment', '770e8400-e29b-41d4-a716-446655440000', NULL, 'ahmad@email.com', NOW()),
  ('990e8400-e29b-41d4-a716-446655440002', 'booking_created', 'Booking', '660e8400-e29b-41d4-a716-446655440001', NULL, 'budi@email.com', NOW());

-- ==================== VIEWS FOR COMMON QUERIES ====================
-- NOTE: The following convenience views were removed from this schema
-- because the application uses the canonical tables (`booking`,
-- `payment`, `field_schedule`) and views caused duplication in the
-- Supabase schema. If you need these denormalized views for external
-- reporting, recreate them manually in the DB or restore from backup.

-- Removed views: guest_booking_history, daily_revenue, field_availability