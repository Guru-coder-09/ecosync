// supabase/functions/sign-permit/index.ts
// Edge Function: Signs a permit JWT with Ed25519 (EdDSA) private key.
// ⚠️  CRITICAL TRUST BOUNDARY: Private key NEVER leaves this function.
// Deno runtime (Supabase Edge Functions)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    // ── 1. Authenticate the calling user ─────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing Authorization header" }, 401);
    }
    const userJwt = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser(userJwt);
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    // ── 2. Verify caller is a tourist ────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role !== "tourist") {
      return json({ error: "Only tourists may request permit signing" }, 403);
    }

    // ── 3. Parse & validate request body ─────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body?.permit_id || typeof body.permit_id !== "string") {
      return json({ error: "permit_id is required" }, 400);
    }
    const { permit_id } = body as { permit_id: string };

    // ── 4. Fetch permit (must belong to authenticated tourist) ────────
    const { data: permit, error: permitErr } = await supabase
      .from("permits")
      .select("id, zone_id, vehicle_reg_number, passenger_count, slot_end, status")
      .eq("id", permit_id)
      .eq("tourist_id", user.id)
      .eq("status", "ACTIVE")
      .single();

    if (permitErr || !permit) {
      return json({ error: "Active permit not found or access denied" }, 404);
    }

    // Ensure the slot hasn't expired yet
    const slotEndUtc = new Date(permit.slot_end).getTime();
    if (slotEndUtc < Date.now()) {
      return json({ error: "Permit slot has already expired" }, 422);
    }

    // ── 5. Load private key from Supabase secret ──────────────────────
    const privateKeyPem = Deno.env.get("ECOSYNC_ED25519_PRIVATE_KEY_PEM");
    if (!privateKeyPem) {
      console.error("ECOSYNC_ED25519_PRIVATE_KEY_PEM secret is not set");
      return json({ error: "Server configuration error" }, 500);
    }

    const privateKey = await importPKCS8(privateKeyPem, "EdDSA");

    // ── 6. Build payload with current TOTP salt (UTC, 30s window) ─────
    // All timestamps are UTC epoch seconds — timezone-agnostic
    const salt = Math.floor(Date.now() / 30000); // TOTP counter
    const expUnix = Math.floor(slotEndUtc / 1000);

    const payload = {
      pid: permit.id,            // permit UUID
      zid: permit.zone_id,       // zone UUID
      veh: permit.vehicle_reg_number,
      count: permit.passenger_count,
      exp: expUnix,              // slot_end as UTC unix timestamp
      salt,                      // current 30s TOTP counter (UTC)
    };

    // ── 7. Sign compact JWT with EdDSA (Ed25519) ─────────────────────
    const signedJwt = await new SignJWT(payload)
      .setProtectedHeader({ alg: "EdDSA" })
      .setIssuedAt()
      .setIssuer("ecosync-dpi-goi-v1")
      .setJwtId(permit.id)
      // NOTE: We do NOT use .setExpirationTime() from jose here because
      // expiry validation uses our custom `exp` field with TOTP salt logic.
      .sign(privateKey);

    // ── 8. Persist signed_token back to permit row ────────────────────
    await supabase
      .from("permits")
      .update({ signed_token: signedJwt })
      .eq("id", permit_id);

    return json({ token: signedJwt, salt, expires_utc: permit.slot_end });
  } catch (err) {
    console.error("sign-permit error:", err);
    return json({ error: String((err as Error).message ?? err) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
