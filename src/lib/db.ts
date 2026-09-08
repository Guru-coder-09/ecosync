// src/lib/db.ts
// Typed Supabase query helpers for EcoSync tables

import { supabase } from "./supabase";
import type { Zone, Permit, ScanLog, Profile, BookingFormData } from "./types";

// ─── ZONES ───────────────────────────────────────────────────────────────────

export async function fetchZones(): Promise<Zone[]> {
  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Zone[];
}

export async function fetchZoneById(id: string): Promise<Zone> {
  const { data, error } = await supabase
    .from("zones")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Zone;
}

export async function updateZoneStatus(
  id: string,
  updates: Partial<Pick<Zone, "hazard_level" | "status" | "safe_capacity" | "current_occupancy">>
): Promise<void> {
  const { error } = await supabase.from("zones").update(updates).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function lockdownZone(id: string): Promise<void> {
  const { error } = await supabase
    .from("zones")
    .update({ hazard_level: "LOCKDOWN", status: "CLOSED" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function liftLockdown(id: string): Promise<void> {
  const { error } = await supabase
    .from("zones")
    .update({ hazard_level: "NORMAL", status: "OPEN" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── PERMITS ─────────────────────────────────────────────────────────────────

export async function fetchMyPermits(userId: string): Promise<Permit[]> {
  const { data, error } = await supabase
    .from("permits")
    .select("*, zones(name, state, hazard_level, status)")
    .eq("tourist_id", userId)
    .order("slot_start", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Permit[];
}

export async function fetchPermitById(id: string): Promise<Permit> {
  const { data, error } = await supabase
    .from("permits")
    .select("*, zones(name, state, hazard_level, status)")
    .eq("id", id)
    .single();
  if (error) throw new Error(error.message);
  return data as Permit;
}

export async function createPermit(
  userId: string,
  form: BookingFormData,
  discount?: { applied: boolean; percent: number }
): Promise<Permit> {
  const { data, error } = await supabase
    .from("permits")
    .insert({
      tourist_id: userId,
      zone_id: form.zone_id,
      vehicle_reg_number: form.vehicle_reg_number.toUpperCase(),
      slot_start: form.slot_start,   // already UTC ISO from UI
      slot_end: form.slot_end,
      passenger_count: form.passenger_count,
      status: "ACTIVE",
      discount_applied: discount?.applied ?? false,
      discount_percent: discount?.percent ?? 0,
    })
    .select("*, zones(name, state, hazard_level, status)")
    .single();
  if (error) throw new Error(error.message);
  return data as Permit;
}

export async function updatePermitToken(permitId: string, token: string): Promise<void> {
  const { error } = await supabase
    .from("permits")
    .update({ signed_token: token })
    .eq("id", permitId);
  if (error) throw new Error(error.message);
}

export async function revokePermit(permitId: string): Promise<void> {
  const { error } = await supabase
    .from("permits")
    .update({ status: "REVOKED" })
    .eq("id", permitId);
  if (error) throw new Error(error.message);
}

// ─── SCAN LOGS ────────────────────────────────────────────────────────────────

export interface InsertScanLogParams {
  permit_id: string;
  guard_id: string;
  zone_id: string;
  scan_type: "ENTRY" | "EXIT";
  verified: boolean;
  failure_reason?: string;
  client_salt?: number;
  offline_captured_at?: string;
  offline_synced_at?: string;
}

export async function insertScanLog(params: InsertScanLogParams): Promise<ScanLog> {
  const { data, error } = await supabase
    .from("scan_logs")
    .insert(params)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as ScanLog;
}

export async function batchInsertScanLogs(
  logs: InsertScanLogParams[]
): Promise<number> {
  if (logs.length === 0) return 0;
  const { error, count } = await supabase
    .from("scan_logs")
    .insert(logs)
    .select("id");
  if (error) throw new Error(error.message);
  return count ?? logs.length;
}

export async function fetchRecentScanLogs(
  options: { zoneId?: string; limit?: number } = {}
): Promise<ScanLog[]> {
  let query = supabase
    .from("scan_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  if (options.zoneId) {
    query = query.eq("zone_id", options.zoneId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as ScanLog[];
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  return (data as Profile) ?? null;
}
