import { create } from "zustand";
import type { Zone } from "../lib/types";
import { apiGetZones, apiUpdateZone, apiLockdownZone } from "../lib/api";

interface ZoneState {
  zones: Zone[];
  loading: boolean;
  error: string | null;
  fetchZones: () => Promise<void>;
  updateZone: (id: string, updates: Partial<Zone>) => Promise<void>;
  lockdownZone: (id: string) => Promise<void>;
  liftLockdown: (id: string) => Promise<void>;
  subscribeToZones: () => () => void;
}

let demoInterval: ReturnType<typeof setInterval> | null = null;

export const useZoneStore = create<ZoneState>((set, get) => ({
  zones: [],
  loading: false,
  error: null,

  fetchZones: async () => {
    set({ loading: true, error: null });
    try {
      const zones = await apiGetZones();
      set({ zones, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  updateZone: async (id, updates) => {
    // Optimistic update
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, ...updates } : z)),
    }));
    await apiUpdateZone(id, updates);
  },

  lockdownZone: async (id) => {
    set((s) => ({
      zones: s.zones.map((z) =>
        z.id === id ? { ...z, hazard_level: "LOCKDOWN", status: "CLOSED" } : z
      ),
    }));
    await apiLockdownZone(id);
  },

  liftLockdown: async (id) => {
    await get().updateZone(id, { hazard_level: "NORMAL", status: "OPEN" });
  },

  subscribeToZones: () => {
    // Live occupancy drift simulation for presentation/hackathon demo
    if (!demoInterval) {
      demoInterval = setInterval(() => {
        set((s) => ({
          zones: s.zones.map((z) => {
            if (z.status === "CLOSED") return z;
            const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
            const newOcc = Math.max(0, Math.min(z.safe_capacity, z.current_occupancy + delta));
            return { ...z, current_occupancy: newOcc };
          }),
        }));
      }, 5000);
    }
    return () => {
      if (demoInterval) {
        clearInterval(demoInterval);
        demoInterval = null;
      }
    };
  },
}));
