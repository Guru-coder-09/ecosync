// src/stores/permitStore.ts
// Manages permit lifecycle: fetch, create, sign, and display for tourists.

import { create } from "zustand";
import type { Permit, BookingFormData } from "../lib/types";
import { apiGetPermits, apiCreatePermit, apiSignPermit } from "../lib/api";

interface PermitState {
  permits: Permit[];
  activePermit: Permit | null;    // Currently displayed E-Pass
  loading: boolean;
  error: string | null;
  fetchMyPermits: (userId: string) => Promise<void>;
  createPermit: (
    userId: string,
    form: BookingFormData,
    discount?: { applied: boolean; percent: number }
  ) => Promise<Permit>;
  setActivePermit: (permit: Permit | null) => void;
  requestSignedToken: (permit: Permit, accessToken?: string) => Promise<string>;
}

export const usePermitStore = create<PermitState>((set) => ({
  permits: [],
  activePermit: null,
  loading: false,
  error: null,

  fetchMyPermits: async (userId) => {
    set({ loading: true, error: null });
    try {
      const permits = await apiGetPermits(userId);
      set({ permits, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createPermit: async (userId, form, discount) => {
    set({ loading: true, error: null });
    try {
      const permit = await apiCreatePermit(userId, form, discount);
      set((s) => ({ permits: [permit, ...s.permits], loading: false }));
      return permit;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  setActivePermit: (permit) => set({ activePermit: permit }),

  requestSignedToken: async (permit) => {
    const { token } = await apiSignPermit(permit.id);
    const updatedPermit: Permit = { ...permit, signed_token: token };

    set((s) => ({
      permits: s.permits.map((p) => (p.id === permit.id ? updatedPermit : p)),
      activePermit: s.activePermit?.id === permit.id ? updatedPermit : s.activePermit,
    }));

    return token;
  },
}));
