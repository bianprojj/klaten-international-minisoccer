-- Ensure payment/invoice tables exist (production drift: P2021 table missing).
-- Idempotent: safe to run on existing DBs.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS payment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  midtrans_order_id VARCHAR(255) UNIQUE,
  snap_token TEXT,
  payment_link_url TEXT,
  amount INTEGER NOT NULL,
  payment_method VARCHAR(100) DEFAULT 'Midtrans',
  provider VARCHAR(100) DEFAULT 'Midtrans',
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  expired_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  booking_id UUID UNIQUE NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  payment_id UUID UNIQUE NOT NULL REFERENCES payment(id) ON DELETE CASCADE,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  subtotal INTEGER NOT NULL,
  tax INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'issued',
  issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE schedule_slot ADD COLUMN IF NOT EXISTS price INTEGER DEFAULT 0;
