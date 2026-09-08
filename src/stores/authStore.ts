// src/stores/authStore.ts
import { create } from "zustand";
import type { User, Session } from "@supabase/supabase-js";
import type { Profile, UserRole } from "../lib/types";
import { IS_DEMO_MODE } from "../lib/env";
import { MOCK_PROFILES, DEMO_ACCOUNTS } from "../lib/mockData";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── DEMO MODE AUTH ──────────────────────────────────────────────────────────
const SESSION_KEY = "ecosync_demo_auth";

function makeFakeUser(profile: Profile): User {
  return {
    id: profile.user_id,
    email: DEMO_ACCOUNTS[MOCK_PROFILES.indexOf(profile)]?.email ?? "demo@ecosync.in",
    app_metadata: {},
    user_metadata: { full_name: profile.full_name, role: profile.role },
    aud: "authenticated",
    created_at: profile.created_at,
  } as User;
}

function saveDemoSession(profile: Profile) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ profileId: profile.id }));
}

function loadDemoSession(): Profile | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  const { profileId } = JSON.parse(raw) as { profileId: string };
  return MOCK_PROFILES.find((p) => p.id === profileId) ?? null;
}

// ─── STORE ───────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  role: null,
  loading: true,
  error: null,

  initialize: async () => {
    if (IS_DEMO_MODE) {
      const profile = loadDemoSession();
      if (profile) {
        set({ user: makeFakeUser(profile), profile, role: profile.role, loading: false });
      } else {
        set({ loading: false });
      }
      return;
    }

    // PROD: restore from Supabase session
    const { supabase } = await import("../lib/supabase");
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();
      set({
        user: session.user,
        session,
        profile: profile ?? null,
        role: (profile as Profile | null)?.role ?? null,
        loading: false,
      });
    } else {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();
        set({
          user: session.user,
          session,
          profile: profile ?? null,
          role: (profile as Profile | null)?.role ?? null,
        });
      } else {
        set({ user: null, session: null, profile: null, role: null });
      }
    });
  },

  signIn: async (email, _password) => {
    set({ error: null, loading: true });
    try {
      if (IS_DEMO_MODE) {
        // Accept any demo email — role derived from prefix
        const match = DEMO_ACCOUNTS.find(
          (a) => a.email.toLowerCase() === email.toLowerCase()
        );
        const profile = match
          ? MOCK_PROFILES[match.profileIdx]
          : MOCK_PROFILES[0]; // default to tourist for custom emails

        saveDemoSession(profile);
        set({ user: makeFakeUser(profile), profile, role: profile.role, loading: false });
        return;
      }

      const { supabase } = await import("../lib/supabase");
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      if (error) throw error;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
    set({ loading: false });
  },

  signUp: async (email, password, role, fullName) => {
    set({ error: null, loading: true });
    try {
      if (IS_DEMO_MODE) {
        const newProfile: Profile = {
          id: `profile-${crypto.randomUUID()}`,
          user_id: `user-${crypto.randomUUID()}`,
          role,
          full_name: fullName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        saveDemoSession(newProfile);
        set({ user: makeFakeUser(newProfile), profile: newProfile, role, loading: false });
        return;
      }

      const { supabase } = await import("../lib/supabase");
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, full_name: fullName } },
      });
      if (error) throw error;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
    set({ loading: false });
  },

  signOut: async () => {
    if (IS_DEMO_MODE) {
      sessionStorage.removeItem(SESSION_KEY);
      set({ user: null, session: null, profile: null, role: null });
      return;
    }
    const { supabase } = await import("../lib/supabase");
    await supabase.auth.signOut();
    set({ user: null, session: null, profile: null, role: null });
  },
}));
