// src/lib/supabase.ts
// Supabase client singleton — typed with Database schema

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Copy .env.example → .env and fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      "x-ecosync-client": "dpi-web-v1",
    },
  },
});

/** Returns the current user's access token for Edge Function calls */
export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Typed helper to call a Supabase Edge Function */
export async function callEdgeFunction<T>(
  functionName: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(
    `${supabaseUrl}/functions/v1/${functionName}`,
    {
      method: body !== undefined ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token ?? supabaseAnonKey}`,
        apikey: supabaseAnonKey,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error((err as { error?: string }).error ?? `Edge function ${functionName} failed`);
  }

  return response.json() as Promise<T>;
}
