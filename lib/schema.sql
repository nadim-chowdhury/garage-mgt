-- ============================================================
-- Garage Management System — Database Schema (v2)
-- Multi-garage, multi-user with role-based access.
-- Run this against your Neon PostgreSQL database once.
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------
-- 0a. Garages
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS garages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255)  NOT NULL,
  address         TEXT          DEFAULT '',
  owner_name      VARCHAR(255)  DEFAULT '',
  owner_mobile    VARCHAR(20)   DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------
-- 0b. Users (auth — phone + password)
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone           VARCHAR(20)   NOT NULL UNIQUE,
  password_hash   TEXT          NOT NULL,
  name            VARCHAR(255)  NOT NULL,
  role            VARCHAR(10)   NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','operator','viewer')),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  status          VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_phone     ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_garage    ON users(garage_id);

-- -----------------------------------------------------------
-- 1. Tenants
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  name            VARCHAR(255)  NOT NULL,
  mobile          VARCHAR(20)   NOT NULL,
  nid             VARCHAR(50)   DEFAULT '',
  address         TEXT          DEFAULT '',
  vehicle_type    VARCHAR(30)   NOT NULL DEFAULT 'other',
  monthly_rent    DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (monthly_rent >= 0),
  rent_due_day    INT           NOT NULL DEFAULT 1  CHECK (rent_due_day BETWEEN 1 AND 28),
  security_deposit DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (security_deposit >= 0),
  status          VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  notes           TEXT          DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_garage ON tenants(garage_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_mobile ON tenants(mobile);

-- -----------------------------------------------------------
-- 2. Vehicles
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  vehicle_number  VARCHAR(50)   NOT NULL,
  vehicle_type    VARCHAR(30)   NOT NULL DEFAULT 'other',
  owner_name      VARCHAR(255)  DEFAULT '',
  owner_mobile    VARCHAR(20)   DEFAULT '',
  driver_name     VARCHAR(255)  DEFAULT '',
  driver_mobile   VARCHAR(20)   DEFAULT '',
  notes           TEXT          DEFAULT '',
  status          VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_garage ON vehicles(garage_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_number ON vehicles(vehicle_number);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);

-- -----------------------------------------------------------
-- 3. Daily Vehicle Entries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_vehicle_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  vehicle_number  VARCHAR(50)   NOT NULL,
  vehicle_type    VARCHAR(30)   NOT NULL DEFAULT 'other',
  owner_name      VARCHAR(255)  DEFAULT '',
  owner_mobile    VARCHAR(20)   DEFAULT '',
  driver_name     VARCHAR(255)  DEFAULT '',
  charge_amount   DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (charge_amount >= 0),
  paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'cash'  CHECK (payment_method IN ('cash','bank','mobile_banking')),
  payment_status  VARCHAR(10)   NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid','partial','unpaid','overdue')),
  notes           TEXT          DEFAULT '',
  entry_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
  entry_time      TIME          NOT NULL DEFAULT CURRENT_TIME,
  exit_time       TIME,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_entries_garage ON daily_vehicle_entries(garage_id);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date   ON daily_vehicle_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_status ON daily_vehicle_entries(payment_status);

-- -----------------------------------------------------------
-- 4. Income Entries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS income_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  tenant_id       UUID          REFERENCES tenants(id) ON DELETE SET NULL,
  vehicle_id      UUID          REFERENCES vehicles(id) ON DELETE SET NULL,
  daily_entry_id  UUID          REFERENCES daily_vehicle_entries(id) ON DELETE SET NULL,
  income_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
  category        VARCHAR(30)   NOT NULL DEFAULT 'other' CHECK (category IN ('monthly_rent','daily_vehicle_charge','security_deposit','other')),
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'cash'  CHECK (payment_method IN ('cash','bank','mobile_banking')),
  receipt_number  VARCHAR(50)   DEFAULT '',
  notes           TEXT          DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_income_garage   ON income_entries(garage_id);
CREATE INDEX IF NOT EXISTS idx_income_date     ON income_entries(income_date);
CREATE INDEX IF NOT EXISTS idx_income_category ON income_entries(category);
CREATE INDEX IF NOT EXISTS idx_income_tenant   ON income_entries(tenant_id);

-- -----------------------------------------------------------
-- 5. Expense Entries
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  expense_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  category        VARCHAR(30)   NOT NULL DEFAULT 'other' CHECK (category IN ('electricity','water','repair_maintenance','salary','other')),
  description     VARCHAR(500)  DEFAULT '',
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'cash'  CHECK (payment_method IN ('cash','bank','mobile_banking')),
  receipt_number  VARCHAR(50)   DEFAULT '',
  notes           TEXT          DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expense_garage   ON expense_entries(garage_id);
CREATE INDEX IF NOT EXISTS idx_expense_date     ON expense_entries(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_entries(category);

-- -----------------------------------------------------------
-- 6. Rent Payments
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS rent_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  garage_id       UUID          NOT NULL REFERENCES garages(id) ON DELETE CASCADE,
  tenant_id       UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rent_month      INT           NOT NULL CHECK (rent_month BETWEEN 1 AND 12),
  rent_year       INT           NOT NULL CHECK (rent_year >= 2020),
  rent_amount     DECIMAL(12,2) NOT NULL CHECK (rent_amount >= 0),
  paid_amount     DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  due_amount      DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (due_amount >= 0),
  payment_method  VARCHAR(20)   NOT NULL DEFAULT 'cash'  CHECK (payment_method IN ('cash','bank','mobile_banking')),
  payment_status  VARCHAR(10)   NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid','partial','unpaid','overdue')),
  payment_date    DATE,
  due_date        DATE          NOT NULL,
  receipt_number  VARCHAR(50)   DEFAULT '',
  notes           TEXT          DEFAULT '',
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, rent_month, rent_year)
);

CREATE INDEX IF NOT EXISTS idx_rent_garage ON rent_payments(garage_id);
CREATE INDEX IF NOT EXISTS idx_rent_tenant ON rent_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_status ON rent_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_rent_period ON rent_payments(rent_year, rent_month);
