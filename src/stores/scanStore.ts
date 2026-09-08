// src/stores/scanStore.ts
// Offline-first scan log management for the Guard PWA.
// Queues verified scans in IndexedDB when offline; syncs to FastAPI on reconnect.

import { create } from "zustand";
import type { ScanLog, OfflineScanEntry, ScanType } from "../lib/types";
import {
  enqueueOfflineScan,
  getAllOfflineScans,
  clearOfflineScans,
  getOfflineScanCount,
} from "../lib/idb";
import { apiGetScanLogs, apiCreateScanLog } from "../lib/api";
import { generateLocalId, nowUTC } from "../lib/utils";

interface ScanState {
  isOffline: boolean;
  pendingCount: number;
  recentScans: ScanLog[];
  guardZoneId: string | null;

  setOffline: (offline: boolean) => void;
  setGuardZoneId: (zoneId: string | null) => void;
  loadPendingCount: () => Promise<void>;
  addScanEntry: (entry: Omit<OfflineScanEntry, "localId" | "offline_captured_at">) => Promise<void>;
  syncOfflineScans: () => Promise<{ synced: number; failed: number }>;
  fetchRecentScans: (zoneId?: string) => Promise<void>;
  subscribeToScans: (zoneId?: string) => () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  isOffline: !navigator.onLine,
  pendingCount: 0,
  recentScans: [],
  guardZoneId: null,

  setOffline: (offline) => set({ isOffline: offline }),
  setGuardZoneId: (zoneId) => set({ guardZoneId: zoneId }),

  loadPendingCount: async () => {
    const count = await getOfflineScanCount();
    set({ pendingCount: count });
  },

  addScanEntry: async (entry) => {
    const fullEntry: OfflineScanEntry = {
      ...entry,
      localId: generateLocalId(),
      offline_captured_at: nowUTC(),
    };

    if (get().isOffline) {
      // 100% Offline: Store in IndexedDB
      await enqueueOfflineScan(fullEntry);
      set((s) => ({ pendingCount: s.pendingCount + 1 }));
      return;
    }

    try {
      // Online: send to FastAPI backend
      await apiCreateScanLog({
        permit_id: fullEntry.permit_id,
        guard_id: fullEntry.guard_id,
        zone_id: fullEntry.zone_id,
        scan_type: fullEntry.scan_type as ScanType,
        verified: fullEntry.verified,
        failure_reason: fullEntry.failure_reason,
        client_salt: fullEntry.client_salt,
        offline_captured_at: fullEntry.offline_captured_at,
      });

      const updated = await apiGetScanLogs(50);
      set({ recentScans: updated });
    } catch {
      // Network hiccup -> fallback to offline queue
      await enqueueOfflineScan(fullEntry);
      set((s) => ({ pendingCount: s.pendingCount + 1 }));
    }
  },

  syncOfflineScans: async () => {
    const entries = await getAllOfflineScans();
    if (entries.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const e of entries) {
      try {
        await apiCreateScanLog({
          permit_id: e.permit_id,
          guard_id: e.guard_id,
          zone_id: e.zone_id,
          scan_type: e.scan_type as ScanType,
          verified: e.verified,
          failure_reason: e.failure_reason,
          client_salt: e.client_salt,
          offline_captured_at: e.offline_captured_at,
        });
        synced++;
      } catch {
        failed++;
      }
    }

    if (synced > 0) {
      await clearOfflineScans(entries.map((e) => e.localId));
      set({ pendingCount: 0 });
      const updated = await apiGetScanLogs(50);
      set({ recentScans: updated });
    }

    return { synced, failed };
  },

  fetchRecentScans: async (_zoneId) => {
    try {
      const scans = await apiGetScanLogs(50);
      set({ recentScans: scans });
    } catch (err) {
      console.error("fetchRecentScans failed:", err);
    }
  },

  subscribeToScans: (_zoneId) => {
    // Poll every 4 seconds to simulate live websocket feed during hackathon demo
    const interval = setInterval(async () => {
      try {
        const scans = await apiGetScanLogs(50);
        set({ recentScans: scans });
      } catch {
        // ignore if offline
      }
    }, 4000);

    return () => clearInterval(interval);
  },
}));

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    const store = useScanStore.getState();
    store.setOffline(false);
    setTimeout(() => store.syncOfflineScans(), 1500);
  });
  window.addEventListener("offline", () => {
    useScanStore.getState().setOffline(true);
  });
}
