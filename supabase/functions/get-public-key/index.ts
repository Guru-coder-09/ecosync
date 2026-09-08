// supabase/functions/get-public-key/index.ts
// Edge Function: Returns the Ed25519 public key JWK for client-side verification.
// The public key is safe to cache in IndexedDB / browser memory — it cannot sign.
// Deno runtime (Supabase Edge Functions)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Cache the parsed public key JWK in memory for the lifetime of this edge worker
let cachedPublicKeyJwk: Record<string, string> | null = null;

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    if (!cachedPublicKeyJwk) {
      // Public key JWK is stored as a separate secret (no private 'd' field)
      // Set via: supabase secrets set ECOSYNC_ED25519_PUBLIC_KEY_JWK='{"kty":"OKP",...}'
      const publicKeyJwkStr = Deno.env.get("ECOSYNC_ED25519_PUBLIC_KEY_JWK");

      if (!publicKeyJwkStr) {
        // Fallback: derive public key from the private key if only private is set
        const privateKeyPem = Deno.env.get("ECOSYNC_ED25519_PRIVATE_KEY_PEM");
        if (!privateKeyPem) {
          return json({ error: "Public key not configured" }, 500);
        }

        // Import private key via Web Crypto to extract public component
        const pkcs8Bytes = pemToBytes(privateKeyPem);
        const cryptoKey = await crypto.subtle.importKey(
          "pkcs8",
          pkcs8Bytes,
          { name: "Ed25519" },
          true,  // extractable
          ["sign"]
        );

        // Export as JWK and strip the private 'd' field
        const fullJwk = await crypto.subtle.exportKey("jwk", cryptoKey);
        const { d: _private, ...publicJwk } = fullJwk as { d?: string; [k: string]: unknown };
        cachedPublicKeyJwk = publicJwk as Record<string, string>;
      } else {
        cachedPublicKeyJwk = JSON.parse(publicKeyJwkStr);
      }
    }

    return new Response(
      JSON.stringify({ publicKey: cachedPublicKeyJwk }),
      {
        headers: {
          ...CORS,
          "Content-Type": "application/json",
          // Cache for 1 hour — public key rarely changes
          "Cache-Control": "public, max-age=3600, s-maxage=3600",
          "ETag": `"ecosync-pubkey-v1"`,
        },
      }
    );
  } catch (err) {
    console.error("get-public-key error:", err);
    return json({ error: "Failed to retrieve public key" }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

/** Convert PEM string to ArrayBuffer for Web Crypto importKey */
function pemToBytes(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");
  const binary = atob(b64);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}
