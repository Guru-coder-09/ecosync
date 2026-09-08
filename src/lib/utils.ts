// src/lib/utils.ts
// Utility helpers — IST formatting, vehicle validation, capacity math

// ─── Timezone Constants ────────────────────────────────────────────────────
/** India Standard Time IANA timezone identifier */
const IST_TZ = "Asia/Kolkata";

/** UTC+5:30 offset in milliseconds — used ONLY for datetime-local inputs */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19800000

// ─── IST Formatting ───────────────────────────────────────────────────────

/**
 * Format any UTC date/string for display in IST.
 * Uses Intl.DateTimeFormat for correctness — never adds manual offsets for display.
 */
export function formatIST(
  utcInput: string | number | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const date =
    typeof utcInput === "string" || typeof utcInput === "number"
      ? new Date(utcInput)
      : utcInput;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TZ,
    ...options,
  }).format(date);
}

/** "08 Sep 2026, 11:27 PM IST" */
export function formatISTDateTime(utcInput: string | number | Date): string {
  return (
    formatIST(utcInput, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " IST"
  );
}

/** "08 September 2026" */
export function formatISTDate(utcInput: string | number | Date): string {
  return formatIST(utcInput, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** "11:27 PM IST" */
export function formatISTTime(utcInput: string | number | Date): string {
  return formatIST(utcInput, { hour: "2-digit", minute: "2-digit", hour12: true }) + " IST";
}

/**
 * Convert a UTC ISO string to a value suitable for <input type="datetime-local"> (IST).
 * datetime-local is timezone-naive, so we manually add the IST offset.
 */
export function utcToISTInput(utcIso: string): string {
  const utcMs = new Date(utcIso).getTime();
  const istDate = new Date(utcMs + IST_OFFSET_MS);
  return istDate.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"
}

/**
 * Convert a datetime-local input value (treated as IST) back to UTC ISO string.
 * Subtract IST offset to get UTC.
 */
export function istInputToUTC(istLocal: string): string {
  const istMs = new Date(istLocal).getTime();
  return new Date(istMs - IST_OFFSET_MS).toISOString();
}

/** Current time as UTC ISO-8601 string */
export function nowUTC(): string {
  return new Date().toISOString();
}

// ─── TOTP / QR Countdown ──────────────────────────────────────────────────

/** Seconds remaining in the current 30-second TOTP window (UTC-based) */
export function secondsUntilNextSalt(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

/** Current 30-second TOTP counter, UTC-based */
export function currentSalt(): number {
  return Math.floor(Date.now() / 30000);
}

// ─── Vehicle Registration ─────────────────────────────────────────────────

/** Indian vehicle format: XX-00-XX-0000 or XX-00-X-0000 */
const VEHICLE_REGEX = /^[A-Z]{2}-\d{2}-[A-Z]{1,3}-\d{4}$/;

export function validateVehicleReg(reg: string): boolean {
  return VEHICLE_REGEX.test(reg.toUpperCase().trim());
}

/** Auto-formats a raw vehicle string: "MH12AB1234" → "MH-12-AB-1234" */
export function formatVehicleReg(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[\s\-]/g, "");
  const match = cleaned.match(/^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}-${match[4]}`;
  return raw.toUpperCase();
}

// ─── Capacity Calculations ────────────────────────────────────────────────

/** Occupancy as 0-100 integer */
export function capacityPct(occupancy: number, safe: number): number {
  if (safe <= 0) return 0;
  return Math.min(100, Math.round((occupancy / safe) * 100));
}

export function capacityColorClass(pct: number): string {
  if (pct >= 95) return "text-red-600";
  if (pct >= 85) return "text-amber-500";
  if (pct >= 70) return "text-yellow-500";
  return "text-eco-800";
}

export function capacityBarClass(pct: number): string {
  if (pct >= 95) return "bg-red-500";
  if (pct >= 85) return "bg-amber-400";
  if (pct >= 70) return "bg-yellow-400";
  return "bg-eco-600";
}

// ─── Status Badges ────────────────────────────────────────────────────────

export function hazardBadgeClass(level: string): string {
  switch (level) {
    case "LOCKDOWN": return "bg-red-100 text-red-800 border border-red-300";
    case "WARNING":  return "bg-amber-100 text-amber-800 border border-amber-300";
    default:         return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  }
}

export function statusBadgeClass(status: string): string {
  switch (status) {
    case "CLOSED":     return "bg-red-100 text-red-800 border border-red-300";
    case "RESTRICTED": return "bg-amber-100 text-amber-800 border border-amber-300";
    default:           return "bg-emerald-100 text-emerald-800 border border-emerald-300";
  }
}

export function permitStatusBadgeClass(status: string): string {
  switch (status) {
    case "ACTIVE":  return "bg-blue-100 text-blue-800 border border-blue-300";
    case "USED":    return "bg-gray-100 text-gray-700 border border-gray-300";
    case "EXPIRED": return "bg-red-100 text-red-700 border border-red-300";
    case "REVOKED": return "bg-red-200 text-red-900 border border-red-400";
    default:        return "bg-gray-100 text-gray-700";
  }
}

// ─── Misc ─────────────────────────────────────────────────────────────────

/** Simple class names combiner */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

/** Generate a UUID v4 (for offline scan local IDs) */
export function generateLocalId(): string {
  return crypto.randomUUID();
}

/** Truncate a long string with ellipsis */
export function truncate(s: string, max = 24): string {
  return s.length > max ? s.slice(0, max) + "…" : s;
}
