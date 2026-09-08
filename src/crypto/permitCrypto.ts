// src/crypto/permitCrypto.ts
/**
 * EcoSync Cryptographic Permit Engine — Ed25519 / EdDSA
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  TRUST MODEL (Critical Architecture Invariant)                      │
 * │                                                                     │
 * │  PRODUCTION:                                                        │
 * │    SIGN   → Supabase Edge Function only. Private key never leaves   │
 * │             the server environment (ECOSYNC_ED25519_PRIVATE_KEY_PEM)│
 * │    VERIFY → jose compactVerify() with public JWK cached in IDB.    │
 * │             Works fully OFFLINE once key is cached.                 │
 * │                                                                     │
 * │  DEV / DEMO MODE (no VITE_SUPABASE_URL set):                       │
 * │    Generates an ephemeral Ed25519 keypair in browser via            │
 * │    crypto.subtle.generateKey(). Persisted to sessionStorage.        │
 * │    Enables full E2E demo: booking → QR → guard scan verification.  │
 * │    Keys are lost on tab close — intentionally non-persistent.       │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * CLOCK-DRIFT MITIGATION:
 *   Salt validation accepts `salt === current || salt === current - 1`
 *   This gives a 30-second grace window for out-of-sync hardware clocks
 *   at remote mountain checkposts.
 */

import { SignJWT, compactVerify, importJWK } from "jose";
import type { PermitPayload, VerificationResult } from "../lib/types";
import { cachePublicKey, getCachedPublicKey } from "../lib/idb";
import { IS_DEMO_MODE } from "../lib/env";

// ─── Constants ────────────────────────────────────────────────────────────────
const TOTP_WINDOW_MS = 30_000; // 30 seconds
const DEV_SESSION_KEY = "ecosync_dev_keypair_v1";
const DEV_PUBKEY_SESSION_KEY = "ecosync_dev_pubkey_v1";

// ─── In-memory caches (module-level singletons) ───────────────────────────────
let _devKeyPair: CryptoKeyPair | null = null;
let _verifyKey: CryptoKey | null = null;

// ─────────────────────────────────────────────────────────────────────────────
// TOTP SALT UTILITIES
// All calculations use Date.now() which is UTC milliseconds — timezone-safe.
// ─────────────────────────────────────────────────────────────────────────────

/** Current UTC-based 30-second TOTP counter */
export function currentSalt(): number {
  return Math.floor(Date.now() / TOTP_WINDOW_MS);
}

/** Seconds remaining in the current 30-second TOTP window */
export function secondsUntilNextSalt(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

/**
 * Validates a client-provided salt with ±1 grace window.
 * Accepts: current window OR the immediately preceding window.
 * Rejects anything older → CLOCK_DRIFT.
 */
export function isSaltValid(clientSalt: number): boolean {
  const now = currentSalt();
  return clientSalt === now || clientSalt === now - 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// DEV-MODE EPHEMERAL KEYPAIR
// ─────────────────────────────────────────────────────────────────────────────

async function getDevKeyPair(): Promise<CryptoKeyPair> {
  if (_devKeyPair) return _devKeyPair;

  // Try to restore from sessionStorage to survive hot-reloads
  const stored = sessionStorage.getItem(DEV_SESSION_KEY);
  if (stored) {
    try {
      const { priv, pub } = JSON.parse(stored) as { priv: JsonWebKey; pub: JsonWebKey };
      const [privateKey, publicKey] = await Promise.all([
        crypto.subtle.importKey("jwk", priv, { name: "Ed25519" }, false, ["sign"]),
        crypto.subtle.importKey("jwk", pub, { name: "Ed25519" }, true, ["verify"]),
      ]);
      _devKeyPair = { privateKey, publicKey };
      console.info("[EcoSync DEV] Restored ephemeral Ed25519 keypair from sessionStorage.");
      return _devKeyPair;
    } catch {
      sessionStorage.removeItem(DEV_SESSION_KEY);
    }
  }

  // Generate new ephemeral pair
  console.info(
    "[EcoSync DEV] Generating ephemeral Ed25519 keypair for demo mode…\n" +
      "This key pair exists only for this browser session."
  );

  _devKeyPair = (await crypto.subtle.generateKey(
    { name: "Ed25519" },
    true, // extractable so we can serialize it
    ["sign", "verify"]
  )) as CryptoKeyPair;

  // Serialize to sessionStorage
  const [priv, pub] = await Promise.all([
    crypto.subtle.exportKey("jwk", _devKeyPair.privateKey),
    crypto.subtle.exportKey("jwk", _devKeyPair.publicKey),
  ]);
  sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ priv, pub }));
  sessionStorage.setItem(DEV_PUBKEY_SESSION_KEY, JSON.stringify(pub));

  console.info("[EcoSync DEV] Public key JWK (safe to share):", pub);
  return _devKeyPair;
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC KEY RETRIEVAL (used by Scanner for offline verification)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the Ed25519 public CryptoKey for verification.
 * Sources (in priority order):
 *   1. In-memory cache (_verifyKey)
 *   2. DEV MODE: sessionStorage ephemeral public key
 *   3. PROD: IndexedDB cache (offline-first)
 *   4. PROD: Fetch from /functions/v1/get-public-key (online only)
 */
export async function getPublicVerifyKey(): Promise<CryptoKey> {
  if (_verifyKey) return _verifyKey;

  if (IS_DEMO_MODE) {
    // Ensure dev keypair is initialised
    await getDevKeyPair();
    const pubStr = sessionStorage.getItem(DEV_PUBKEY_SESSION_KEY);
    if (!pubStr) throw new Error("DEV: Public key not found in sessionStorage");
    const jwk = JSON.parse(pubStr) as JsonWebKey;
    _verifyKey = (await importJWK(jwk as any, "EdDSA")) as CryptoKey;
    return _verifyKey;
  }

  // PROD: try IndexedDB cache first (offline-safe)
  const cached = await getCachedPublicKey();
  if (cached) {
    _verifyKey = (await importJWK(cached as any, "EdDSA")) as CryptoKey;
    return _verifyKey;
  }

  // PROD: fetch from server
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
  const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;
  const resp = await fetch(`${supabaseUrl}/functions/v1/get-public-key`, {
    headers: { Authorization: `Bearer ${anonKey}`, apikey: anonKey },
  });
  if (!resp.ok) throw new Error("Failed to fetch public key from server");

  const { publicKey: jwk } = (await resp.json()) as { publicKey: JsonWebKey };
  await cachePublicKey(jwk as Record<string, string>);
  _verifyKey = (await importJWK(jwk as any, "EdDSA")) as CryptoKey;
  return _verifyKey;
}

/** Pre-warm the public key cache at app startup. Silent failure is acceptable. */
export async function prefetchPublicKey(): Promise<void> {
  try {
    await getPublicVerifyKey();
  } catch (e) {
    console.warn("[EcoSync] Could not pre-fetch public key:", e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMIT SIGNING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds and signs a compact JWT permit token.
 *
 * PROD: delegates to server-side Supabase Edge Function.
 * DEV:  signs locally with ephemeral private key (demo-safe).
 *
 * The `salt` field is always computed fresh at call time to ensure
 * the QR is valid for the current + next 30-second window.
 */
export async function signPermit(
  permitId: string,
  payload: Omit<PermitPayload, "salt">,
  accessToken?: string
): Promise<string> {
  if (IS_DEMO_MODE) {
    return _signLocal(payload);
  }

  // PROD: call Edge Function (private key stays server-side)
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
  const token = accessToken ?? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
  const resp = await fetch(`${supabaseUrl}/functions/v1/sign-permit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ permit_id: permitId }),
  });
  if (!resp.ok) {
    const err = (await resp.json().catch(() => ({ error: resp.statusText }))) as {
      error?: string;
    };
    throw new Error(err.error ?? "Permit signing failed");
  }
  const { token: jwt } = (await resp.json()) as { token: string };
  return jwt;
}

async function _signLocal(payload: Omit<PermitPayload, "salt">): Promise<string> {
  const { privateKey } = await getDevKeyPair();
  const salt = currentSalt();
  const full: PermitPayload = { ...payload, salt };

  const jwt = await new SignJWT(full as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "EdDSA" })
    .setIssuedAt()
    .setIssuer("ecosync-dev-ephemeral")
    .setJti(full.pid)
    .sign(privateKey);

  console.info(`[EcoSync DEV] Permit signed locally. salt=${salt}, pid=${full.pid}`);
  return jwt;
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMIT VERIFICATION (offline-first)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Verifies a scanned compact JWT permit token.
 *
 * Step 1: Verify Ed25519 signature against cached/ephemeral public key
 * Step 2: Check that slot_end (UTC unix seconds) hasn't passed
 * Step 3: Validate TOTP salt with ±1 grace window
 *
 * Returns a typed VerificationResult — NEVER throws.
 * Works fully OFFLINE once the public key is cached.
 */
export async function verifyPermitToken(rawToken: string): Promise<VerificationResult> {
  let publicKey: CryptoKey;
  try {
    publicKey = await getPublicVerifyKey();
  } catch {
    return { valid: false, reason: "NO_PUBLIC_KEY" };
  }

  try {
    const { payload: payloadBytes } = await compactVerify(rawToken, publicKey);
    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as PermitPayload;

    // ─ Check expiry (slot_end) ──────────────────────────────────────
    const nowSeconds = Math.floor(Date.now() / 1000); // UTC epoch seconds
    if (payload.exp < nowSeconds) {
      return { valid: false, reason: "EXPIRED", payload };
    }

    // ─ Validate TOTP salt with ±1 grace window ──────────────────────
    // Mitigates hardware clock drift in remote mountain checkposts.
    if (!isSaltValid(payload.salt)) {
      return { valid: false, reason: "CLOCK_DRIFT", payload };
    }

    return { valid: true, reason: "VERIFIED", payload };
  } catch (err) {
    const msg = String((err as Error)?.message ?? err).toLowerCase();

    if (
      msg.includes("signature") ||
      msg.includes("verify") ||
      msg.includes("jws") ||
      msg.includes("invalid compact")
    ) {
      return { valid: false, reason: "TAMPERED" };
    }

    return { valid: false, reason: "INVALID_FORMAT" };
  }
}
