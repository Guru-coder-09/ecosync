// src/lib/idb.ts
// IndexedDB helpers for offline scan queue and public key caching
// Uses idb-keyval for a simple key/value store over IndexedDB

import { get, set, getMany, del, keys } from "idb-keyval";
import type { OfflineScanEntry } from "./types";

// ─── Key prefixes ─────────────────────────────────────────────────────────
const SCAN_QUEUE_PREFIX = "ecosync_scan_q_";
const PUBLIC_KEY_STORE_KEY = "ecosync_public_key_jwk";

// ─── Scan Queue ───────────────────────────────────────────────────────────

/** Append a scan result to the offline queue */
export async function enqueueOfflineScan(entry: OfflineScanEntry): Promise<void> {
  await set(`${SCAN_QUEUE_PREFIX}${entry.localId}`, entry);
}

/** Retrieve all queued offline scans */
export async function getAllOfflineScans(): Promise<OfflineScanEntry[]> {
  const allKeys = (await keys()) as string[];
  const scanKeys = allKeys.filter((k) => k.startsWith(SCAN_QUEUE_PREFIX));
  if (scanKeys.length === 0) return [];
  const entries = await getMany(scanKeys);
  return (entries as (OfflineScanEntry | undefined)[]).filter(
    (e): e is OfflineScanEntry => e != null
  );
}

/** Remove synced entries from IndexedDB */
export async function clearOfflineScans(localIds: string[]): Promise<void> {
  await Promise.all(
    localIds.map((id) => del(`${SCAN_QUEUE_PREFIX}${id}`))
  );
}

/** Count pending offline scans */
export async function getOfflineScanCount(): Promise<number> {
  const allKeys = (await keys()) as string[];
  return allKeys.filter((k) => k.startsWith(SCAN_QUEUE_PREFIX)).length;
}

// ─── Public Key Cache ──────────────────────────────────────────────────────

/** Cache the public JWK for offline verification */
export async function cachePublicKey(jwk: Record<string, string>): Promise<void> {
  await set(PUBLIC_KEY_STORE_KEY, jwk);
}

/** Retrieve the cached public JWK (returns null if not cached) */
export async function getCachedPublicKey(): Promise<Record<string, string> | null> {
  const stored = await get(PUBLIC_KEY_STORE_KEY);
  return (stored as Record<string, string> | undefined) ?? null;
}

/** Clear the cached public key (forces re-fetch next time) */
export async function clearCachedPublicKey(): Promise<void> {
  await del(PUBLIC_KEY_STORE_KEY);
}
