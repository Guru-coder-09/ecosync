// src/lib/mockData.ts
// In-memory demo data — mirrors the SQL seed data.
// Used when IS_DEMO_MODE is true (no Supabase credentials configured).

import type { Zone, Permit, ScanLog, Profile } from "./types";

const NOW = new Date();
const TS = (offsetMin = 0) =>
  new Date(NOW.getTime() + offsetMin * 60_000).toISOString();

// ─── MOCK PROFILES ────────────────────────────────────────────────────────────

export const MOCK_PROFILES: Profile[] = [
  {
    id: "profile-tourist-1",
    user_id: "user-tourist-1",
    role: "tourist",
    full_name: "Priya Sharma",
    phone: "+91-98765-43210",
    created_at: TS(-720),
    updated_at: TS(-720),
  },
  {
    id: "profile-guard-1",
    user_id: "user-guard-1",
    role: "guard",
    full_name: "Constable Ramesh Kumar",
    badge_number: "UTK-CHK-042",
    phone: "+91-94567-89012",
    created_at: TS(-1440),
    updated_at: TS(-60),
  },
  {
    id: "profile-auth-1",
    user_id: "user-authority-1",
    role: "authority",
    full_name: "Dr. Ananya Nair (NDMA Deputy Director)",
    phone: "+91-11-2634-5678",
    created_at: TS(-4320),
    updated_at: TS(-120),
  },
];

// ─── MOCK DEMO CREDENTIALS ───────────────────────────────────────────────────
// Any password accepted in demo mode
export const DEMO_ACCOUNTS = [
  { email: "tourist@demo.ecosync.in",   password: "demo1234", profileIdx: 0 },
  { email: "guard@demo.ecosync.in",     password: "demo1234", profileIdx: 1 },
  { email: "authority@demo.ecosync.in", password: "demo1234", profileIdx: 2 },
];

// ─── MOCK ZONES ───────────────────────────────────────────────────────────────
export const MOCK_ZONES: Zone[] = [
  {
    id: "zone-kedarnath",
    name: "Kedarnath Wildlife Sanctuary",
    state: "Uttarakhand",
    safe_capacity: 500,
    current_occupancy: 423,
    hazard_level: "WARNING",
    status: "RESTRICTED",
    weather_status: "Partly Cloudy",
    fastag_gateways: 3,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[79.00, 30.70], [79.10, 30.70], [79.10, 30.80], [79.00, 30.80], [79.00, 30.70]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-15),
  },
  {
    id: "zone-mudumalai",
    name: "Mudumalai Tiger Reserve",
    state: "Tamil Nadu",
    safe_capacity: 800,
    current_occupancy: 312,
    hazard_level: "NORMAL",
    status: "OPEN",
    weather_status: "Clear",
    fastag_gateways: 5,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[76.50, 11.50], [76.70, 11.50], [76.70, 11.70], [76.50, 11.70], [76.50, 11.50]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-5),
  },
  {
    id: "zone-ghnp",
    name: "Great Himalayan National Park",
    state: "Himachal Pradesh",
    safe_capacity: 350,
    current_occupancy: 89,
    hazard_level: "NORMAL",
    status: "OPEN",
    weather_status: "Sunny",
    fastag_gateways: 2,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[77.20, 31.70], [77.40, 31.70], [77.40, 31.90], [77.20, 31.90], [77.20, 31.70]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-30),
  },
  {
    id: "zone-sundarbans",
    name: "Sundarbans Biosphere Reserve",
    state: "West Bengal",
    safe_capacity: 600,
    current_occupancy: 571,
    hazard_level: "WARNING",
    status: "RESTRICTED",
    weather_status: "Humid & Hazy",
    fastag_gateways: 4,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[88.70, 21.80], [89.00, 21.80], [89.00, 22.00], [88.70, 22.00], [88.70, 21.80]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-2),
  },
  {
    id: "zone-kaziranga",
    name: "Kaziranga National Park",
    state: "Assam",
    safe_capacity: 400,
    current_occupancy: 45,
    hazard_level: "NORMAL",
    status: "OPEN",
    weather_status: "Light Rain",
    fastag_gateways: 3,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[93.10, 26.50], [93.30, 26.50], [93.30, 26.70], [93.10, 26.70], [93.10, 26.50]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-45),
  },
  {
    id: "zone-vof",
    name: "Valley of Flowers",
    state: "Uttarakhand",
    safe_capacity: 200,
    current_occupancy: 200,
    hazard_level: "LOCKDOWN",
    status: "CLOSED",
    weather_status: "Heavy Rain & Landslide Risk",
    fastag_gateways: 1,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[79.60, 30.70], [79.70, 30.70], [79.70, 30.80], [79.60, 30.80], [79.60, 30.70]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-3),
  },
  {
    id: "zone-corbett",
    name: "Jim Corbett National Park",
    state: "Uttarakhand",
    safe_capacity: 700,
    current_occupancy: 390,
    hazard_level: "NORMAL",
    status: "OPEN",
    weather_status: "Clear",
    fastag_gateways: 6,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[78.70, 29.50], [78.90, 29.50], [78.90, 29.70], [78.70, 29.70], [78.70, 29.50]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-10),
  },
  {
    id: "zone-ranthambore",
    name: "Ranthambore Tiger Reserve",
    state: "Rajasthan",
    safe_capacity: 450,
    current_occupancy: 411,
    hazard_level: "WARNING",
    status: "RESTRICTED",
    weather_status: "Sunny & Hot",
    fastag_gateways: 4,
    boundary: {
      type: "Polygon",
      coordinates: [
        [[76.30, 25.90], [76.50, 25.90], [76.50, 26.10], [76.30, 26.10], [76.30, 25.90]],
      ],
    },
    created_at: TS(-10080),
    updated_at: TS(-8),
  },
];

// ─── MOCK PERMITS ─────────────────────────────────────────────────────────────
export const MOCK_PERMITS: Permit[] = [
  {
    id: "permit-demo-1",
    tourist_id: "user-tourist-1",
    zone_id: "zone-mudumalai",
    vehicle_reg_number: "TN-38-AB-1234",
    slot_start: TS(60),          // 1 hour from now
    slot_end: TS(60 + 360),      // 6-hour window
    passenger_count: 4,
    status: "ACTIVE",
    signed_token: null,          // Will be signed on demand
    discount_applied: false,
    discount_percent: 0,
    created_at: TS(-30),
    updated_at: TS(-30),
    zones: {
      name: "Mudumalai Tiger Reserve",
      state: "Tamil Nadu",
      hazard_level: "NORMAL",
      status: "OPEN",
    },
  },
  {
    id: "permit-demo-2",
    tourist_id: "user-tourist-1",
    zone_id: "zone-kedarnath",
    vehicle_reg_number: "DL-01-CD-5678",
    slot_start: TS(-180),        // Started 3h ago
    slot_end: TS(180),           // Ends in 3h
    passenger_count: 2,
    status: "ACTIVE",
    signed_token: null,
    discount_applied: true,
    discount_percent: 20,
    created_at: TS(-480),
    updated_at: TS(-180),
    zones: {
      name: "Kedarnath Wildlife Sanctuary",
      state: "Uttarakhand",
      hazard_level: "WARNING",
      status: "RESTRICTED",
    },
  },
];

// ─── MOCK SCAN LOGS ───────────────────────────────────────────────────────────
export const MOCK_SCAN_LOGS: ScanLog[] = [
  {
    id: "scan-1",
    permit_id: "permit-demo-2",
    guard_id: "user-guard-1",
    zone_id: "zone-kedarnath",
    scan_type: "ENTRY",
    verified: true,
    client_salt: Math.floor(Date.now() / 30000) - 12,
    offline_captured_at: TS(-180),
    created_at: TS(-180),
  },
  {
    id: "scan-2",
    permit_id: "permit-demo-1",
    guard_id: "user-guard-1",
    zone_id: "zone-mudumalai",
    scan_type: "ENTRY",
    verified: false,
    failure_reason: "CLOCK_DRIFT",
    client_salt: Math.floor(Date.now() / 30000) - 50,
    offline_captured_at: TS(-60),
    created_at: TS(-60),
  },
  {
    id: "scan-3",
    permit_id: "permit-demo-1",
    guard_id: "user-guard-1",
    zone_id: "zone-mudumalai",
    scan_type: "ENTRY",
    verified: true,
    client_salt: Math.floor(Date.now() / 30000) - 2,
    offline_captured_at: TS(-55),
    created_at: TS(-55),
  },
  {
    id: "scan-4",
    permit_id: "permit-demo-2",
    guard_id: "user-guard-1",
    zone_id: "zone-kedarnath",
    scan_type: "EXIT",
    verified: true,
    client_salt: Math.floor(Date.now() / 30000) - 1,
    created_at: TS(-10),
  },
];
