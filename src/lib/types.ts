// src/lib/types.ts
// Shared type definitions for EcoSync DPI

// ─── RBAC ───────────────────────────────────────────────────────────────────
export type UserRole = "tourist" | "guard" | "authority";

// ─── ZONE ───────────────────────────────────────────────────────────────────
export type HazardLevel = "NORMAL" | "WARNING" | "LOCKDOWN";
export type ZoneStatus = "OPEN" | "RESTRICTED" | "CLOSED";

export interface Zone {
  id: string;
  name: string;
  state: string;
  safe_capacity: number;
  current_occupancy: number;
  /** PostGIS GeoJSON polygon (available only when explicitly selected) */
  boundary?: GeoJSONPolygon | null;
  hazard_level: HazardLevel;
  status: ZoneStatus;
  weather_status: string;
  fastag_gateways: number;
  created_at: string; // ISO-8601 UTC
  updated_at: string; // ISO-8601 UTC
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: [number, number][][];
}

export interface ZoneTelemetry extends Zone {
  occupancy_pct: number;
  active_permits: number;
  active_headcount: number;
  scans_last_hour: number;
}

// ─── PERMITS ────────────────────────────────────────────────────────────────
export type PermitStatus = "ACTIVE" | "USED" | "EXPIRED" | "REVOKED";

export interface Permit {
  id: string;
  tourist_id: string;
  zone_id: string;
  vehicle_reg_number: string;
  slot_start: string;  // ISO-8601 UTC
  slot_end: string;    // ISO-8601 UTC
  passenger_count: number;
  status: PermitStatus;
  signed_token?: string | null;  // Compact JWT (EdDSA), null until signed
  discount_applied: boolean;
  discount_percent: number;
  created_at: string;
  updated_at: string;
  // Joined
  zones?: Pick<Zone, "name" | "state" | "hazard_level" | "status"> | null;
}

// ─── SCAN LOGS ──────────────────────────────────────────────────────────────
export type ScanType = "ENTRY" | "EXIT";

export interface ScanLog {
  id: string;
  permit_id: string;
  guard_id: string;
  zone_id: string;
  scan_type: ScanType;
  verified: boolean;
  failure_reason?: string | null;
  client_salt?: number | null;
  offline_captured_at?: string | null;
  offline_synced_at?: string | null;
  created_at: string;
}

// ─── PROFILES ───────────────────────────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  role: UserRole;
  full_name: string;
  phone?: string | null;
  badge_number?: string | null;
  created_at: string;
  updated_at: string;
}

// ─── CRYPTOGRAPHIC PERMIT PAYLOAD ───────────────────────────────────────────
/** The JWT payload embedded in QR codes — all values UTC / timezone-agnostic */
export interface PermitPayload {
  /** permit UUID */
  pid: string;
  /** zone UUID */
  zid: string;
  /** vehicle registration string */
  veh: string;
  /** passenger count */
  count: number;
  /** slot_end as UTC unix epoch seconds */
  exp: number;
  /** TOTP 30s rotating counter: Math.floor(Date.now() / 30000) — UTC */
  salt: number;
  /** Standard JWT fields (set by jose) */
  iss?: string;
  iat?: number;
  jti?: string;
}

// ─── VERIFICATION ───────────────────────────────────────────────────────────
export type VerificationFailReason =
  | "EXPIRED"
  | "TAMPERED"
  | "CLOCK_DRIFT"
  | "INVALID_FORMAT"
  | "NO_PUBLIC_KEY";

export interface VerificationResult {
  valid: boolean;
  reason: "VERIFIED" | VerificationFailReason;
  payload?: PermitPayload;
}

// ─── OFFLINE SYNC ───────────────────────────────────────────────────────────
export interface OfflineScanEntry {
  /** Local client-side UUID (not the DB id) */
  localId: string;
  permit_id: string;
  guard_id: string;
  zone_id: string;
  scan_type: ScanType;
  verified: boolean;
  failure_reason?: string;
  client_salt?: number;
  /** ISO-8601 UTC captured on device */
  offline_captured_at: string;
}

// ─── BOOKING FORM ───────────────────────────────────────────────────────────
export interface BookingFormData {
  zone_id: string;
  vehicle_reg_number: string;
  passenger_count: number;
  slot_start: string; // datetime-local string (IST, converted to UTC before DB)
  slot_end: string;
  apply_discount: boolean;
}

// ─── DASHBOARD STATS ────────────────────────────────────────────────────────
export interface DashboardStats {
  totalActiveHeadcount: number;
  avgCapacityPercent: number;
  totalFastagGateways: number;
  zonesInLockdown: number;
  zonesInWarning: number;
  totalActivePermits: number;
}
