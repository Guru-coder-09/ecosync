-- =====================================================================
-- EcoSync: Government of India DPI — Ecological Carrying Capacity
-- Migration: 001_ecosync_schema.sql
-- PostgreSQL 16 + PostGIS
-- All timestamps stored as TIMESTAMPTZ (UTC) per spec requirement
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role    AS ENUM ('tourist', 'guard', 'authority');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE hazard_level AS ENUM ('NORMAL', 'WARNING', 'LOCKDOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE zone_status  AS ENUM ('OPEN', 'RESTRICTED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE permit_status AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scan_type    AS ENUM ('ENTRY', 'EXIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────
-- UTILITY: set updated_at trigger function
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW(); -- NOW() is always UTC in PostgreSQL
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────
-- PROFILES  (linked to auth.users via trigger)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  role         user_role   NOT NULL DEFAULT 'tourist',
  full_name    TEXT        NOT NULL DEFAULT '',
  phone        TEXT,
  badge_number TEXT,       -- Guards only: checkpost identifier
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a profile row when a new auth.user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'tourist'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- ZONES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.zones (
  id                UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name              TEXT         NOT NULL,
  state             TEXT         NOT NULL,
  safe_capacity     INTEGER      NOT NULL CHECK (safe_capacity > 0),
  current_occupancy INTEGER      NOT NULL DEFAULT 0 CHECK (current_occupancy >= 0),
  boundary          GEOMETRY(Polygon, 4326),   -- WGS84 lat/lon
  hazard_level      hazard_level NOT NULL DEFAULT 'NORMAL',
  status            zone_status  NOT NULL DEFAULT 'OPEN',
  weather_status    TEXT         NOT NULL DEFAULT 'Clear',
  fastag_gateways   INTEGER      NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TRIGGER zones_set_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Spatial GiST index for geofence queries
CREATE INDEX IF NOT EXISTS idx_zones_boundary    ON public.zones USING GIST (boundary);
CREATE INDEX IF NOT EXISTS idx_zones_hazard_level ON public.zones(hazard_level);
CREATE INDEX IF NOT EXISTS idx_zones_status       ON public.zones(status);

-- ─────────────────────────────────────────────────────────────────────
-- SEED DATA — representative Indian ecological zones
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO public.zones (name, state, safe_capacity, current_occupancy, hazard_level, status, weather_status, fastag_gateways, boundary)
VALUES
  ('Kedarnath Wildlife Sanctuary',  'Uttarakhand',     500, 423, 'WARNING',  'RESTRICTED', 'Partly Cloudy', 3,
   ST_GeomFromText('POLYGON((79.00 30.70, 79.10 30.70, 79.10 30.80, 79.00 30.80, 79.00 30.70))', 4326)),

  ('Mudumalai Tiger Reserve',       'Tamil Nadu',      800, 312, 'NORMAL',   'OPEN',       'Clear',         5,
   ST_GeomFromText('POLYGON((76.50 11.50, 76.70 11.50, 76.70 11.70, 76.50 11.70, 76.50 11.50))', 4326)),

  ('Great Himalayan National Park', 'Himachal Pradesh',350,  89, 'NORMAL',   'OPEN',       'Sunny',         2,
   ST_GeomFromText('POLYGON((77.20 31.70, 77.40 31.70, 77.40 31.90, 77.20 31.90, 77.20 31.70))', 4326)),

  ('Sundarbans Biosphere Reserve',  'West Bengal',     600, 571, 'WARNING',  'RESTRICTED', 'Humid & Hazy',  4,
   ST_GeomFromText('POLYGON((88.70 21.80, 89.00 21.80, 89.00 22.00, 88.70 22.00, 88.70 21.80))', 4326)),

  ('Kaziranga National Park',       'Assam',           400,  45, 'NORMAL',   'OPEN',       'Light Rain',    3,
   ST_GeomFromText('POLYGON((93.10 26.50, 93.30 26.50, 93.30 26.70, 93.10 26.70, 93.10 26.50))', 4326)),

  ('Valley of Flowers',             'Uttarakhand',     200, 200, 'LOCKDOWN', 'CLOSED',     'Heavy Rain',    1,
   ST_GeomFromText('POLYGON((79.60 30.70, 79.70 30.70, 79.70 30.80, 79.60 30.80, 79.60 30.70))', 4326)),

  ('Jim Corbett National Park',     'Uttarakhand',     700, 390, 'NORMAL',   'OPEN',       'Clear',         6,
   ST_GeomFromText('POLYGON((78.70 29.50, 78.90 29.50, 78.90 29.70, 78.70 29.70, 78.70 29.50))', 4326)),

  ('Ranthambore Tiger Reserve',     'Rajasthan',       450, 411, 'WARNING',  'RESTRICTED', 'Sunny & Hot',   4,
   ST_GeomFromText('POLYGON((76.30 25.90, 76.50 25.90, 76.50 26.10, 76.30 26.10, 76.30 25.90))', 4326))
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────
-- PERMITS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.permits (
  id                  UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  tourist_id          UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  zone_id             UUID          NOT NULL REFERENCES public.zones(id),
  vehicle_reg_number  TEXT          NOT NULL,  -- Indian format: XX-00-XX-0000 or FASTag
  slot_start          TIMESTAMPTZ   NOT NULL,  -- UTC
  slot_end            TIMESTAMPTZ   NOT NULL,  -- UTC
  passenger_count     INTEGER       NOT NULL DEFAULT 1 CHECK (passenger_count BETWEEN 1 AND 10),
  status              permit_status NOT NULL DEFAULT 'ACTIVE',
  signed_token        TEXT,                    -- Compact JWT (EdDSA) from Edge Function
  discount_applied    BOOLEAN       NOT NULL DEFAULT FALSE,
  discount_percent    INTEGER       NOT NULL DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  CONSTRAINT slot_chronological CHECK (slot_end > slot_start),
  CONSTRAINT slot_duration_max   CHECK (slot_end - slot_start <= INTERVAL '24 hours')
);

CREATE TRIGGER permits_set_updated_at
  BEFORE UPDATE ON public.permits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_permits_tourist_id ON public.permits(tourist_id);
CREATE INDEX IF NOT EXISTS idx_permits_zone_id    ON public.permits(zone_id);
CREATE INDEX IF NOT EXISTS idx_permits_status     ON public.permits(status);
CREATE INDEX IF NOT EXISTS idx_permits_slot_start ON public.permits(slot_start);
CREATE INDEX IF NOT EXISTS idx_permits_composite  ON public.permits(zone_id, status, slot_start);

-- ─────────────────────────────────────────────────────────────────────
-- SCAN LOGS  (append-only immutable tamper-proof ledger)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scan_logs (
  id                  UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  permit_id           UUID      NOT NULL REFERENCES public.permits(id),
  guard_id            UUID      NOT NULL REFERENCES auth.users(id),
  zone_id             UUID      NOT NULL REFERENCES public.zones(id),
  scan_type           scan_type NOT NULL,
  verified            BOOLEAN   NOT NULL DEFAULT FALSE,
  failure_reason      TEXT,                    -- 'EXPIRED' | 'TAMPERED' | 'CLOCK_DRIFT' | 'INVALID_FORMAT'
  client_salt         BIGINT,                  -- TOTP counter captured at scan time for audit
  offline_captured_at TIMESTAMPTZ,             -- Device clock when captured (may be offline, UTC)
  offline_synced_at   TIMESTAMPTZ,             -- When synced back to Supabase (UTC)
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- No updated_at: this table is APPEND-ONLY
);

-- Enforce immutability at DB trigger level
CREATE OR REPLACE FUNCTION public.prevent_scan_log_update()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'scan_logs is an immutable tamper-proof ledger. Updates are prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scan_logs_immutable
  BEFORE UPDATE ON public.scan_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_scan_log_update();

CREATE TRIGGER scan_logs_no_delete
  BEFORE DELETE ON public.scan_logs
  FOR EACH ROW EXECUTE WHEN (current_setting('ecosync.allow_delete', true) IS DISTINCT FROM 'true')
  EXECUTE FUNCTION public.prevent_scan_log_update();

CREATE INDEX IF NOT EXISTS idx_scan_logs_permit_id  ON public.scan_logs(permit_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_zone_id    ON public.scan_logs(zone_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_guard_id   ON public.scan_logs(guard_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON public.scan_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_logs_offline    ON public.scan_logs(offline_synced_at)
  WHERE offline_synced_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permits   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get the role of the currently authenticated user
-- SECURITY DEFINER so it bypasses RLS when called
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ──── PROFILES RLS ────
-- Each user reads / updates only their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid() OR public.get_my_role() = 'authority');

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid())
  -- Role column must not be changed by the user themselves
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE user_id = auth.uid() LIMIT 1));

CREATE POLICY "profiles_insert_trigger"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ──── ZONES RLS ────
-- Any authenticated user can view zones (public data)
CREATE POLICY "zones_select_authenticated"
  ON public.zones FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authorities can mutate zones
CREATE POLICY "zones_all_authority"
  ON public.zones FOR ALL
  USING (public.get_my_role() = 'authority')
  WITH CHECK (public.get_my_role() = 'authority');

-- ──── PERMITS RLS ────
-- Tourists see only their own permits
CREATE POLICY "permits_select_own"
  ON public.permits FOR SELECT
  USING (
    tourist_id = auth.uid()
    OR public.get_my_role() IN ('guard', 'authority')
  );

CREATE POLICY "permits_insert_tourist"
  ON public.permits FOR INSERT
  WITH CHECK (tourist_id = auth.uid() AND public.get_my_role() = 'tourist');

CREATE POLICY "permits_update_authority_or_system"
  ON public.permits FOR UPDATE
  USING (public.get_my_role() = 'authority' OR tourist_id = auth.uid());

CREATE POLICY "permits_delete_authority"
  ON public.permits FOR DELETE
  USING (public.get_my_role() = 'authority');

-- ──── SCAN LOGS RLS ────
-- Guards can INSERT their own scan records
CREATE POLICY "scan_logs_insert_guard"
  ON public.scan_logs FOR INSERT
  WITH CHECK (guard_id = auth.uid() AND public.get_my_role() = 'guard');

-- Guards and authorities can SELECT
CREATE POLICY "scan_logs_select_guard_own"
  ON public.scan_logs FOR SELECT
  USING (guard_id = auth.uid() OR public.get_my_role() = 'authority');

-- No UPDATE or DELETE policy → effectively blocked for everyone
-- (The trigger provides a second layer of defence)

-- ─────────────────────────────────────────────────────────────────────
-- REALTIME  (enable postgres_changes for live dashboard & tourist view)
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.permits;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.scan_logs;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- VIEWS  (convenience view for authority dashboard telemetry)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.zone_telemetry AS
SELECT
  z.id,
  z.name,
  z.state,
  z.safe_capacity,
  z.current_occupancy,
  z.hazard_level,
  z.status,
  z.weather_status,
  z.fastag_gateways,
  ROUND((z.current_occupancy::NUMERIC / z.safe_capacity) * 100, 1) AS occupancy_pct,
  COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'ACTIVE') AS active_permits,
  SUM(p.passenger_count) FILTER (WHERE p.status = 'ACTIVE')::INT AS active_headcount,
  COUNT(sl.id) FILTER (WHERE sl.created_at > NOW() - INTERVAL '1 hour') AS scans_last_hour,
  z.updated_at
FROM public.zones z
LEFT JOIN public.permits p ON p.zone_id = z.id AND p.status = 'ACTIVE'
  AND p.slot_start <= NOW() AND p.slot_end >= NOW()
LEFT JOIN public.scan_logs sl ON sl.zone_id = z.id
GROUP BY z.id;

-- Grant view access to authenticated users (filtered by RLS on underlying tables)
GRANT SELECT ON public.zone_telemetry TO authenticated;
