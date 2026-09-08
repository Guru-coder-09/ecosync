// src/lib/env.ts
// Single source of truth for environment detection

/** Supabase project URL (undefined in demo mode) */
export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

/** Supabase anon key (empty in demo mode) */
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? "";

/**
 * TRUE when Supabase credentials are absent or are still the placeholder values.
 *
 * In DEMO mode:
 *   - All data is served from in-memory mock data (src/lib/mockData.ts)
 *   - Ed25519 signing uses an ephemeral browser keypair (sessionStorage)
 *   - The full booking → QR → guard verification loop works out-of-the-box
 *
 * In PROD mode:
 *   - Live Supabase PostGIS database
 *   - Server-side Ed25519 signing via Edge Function
 */
export const IS_DEMO_MODE =
  !SUPABASE_URL ||
  SUPABASE_URL === "https://your-project-ref.supabase.co" ||
  SUPABASE_URL.trim() === "";

export const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string) ?? "1.0.0";
