import { create } from 'zustand';
import { api, Category } from '../lib/api';

interface AppState {
  categories: Category[];
  loading: boolean;
  simulationMode: boolean;
  fetchData: () => Promise<void>;
  toggleSimulation: () => void;
  triggerSimulatedScan: (gatewayId: number, zoneId: number, type: 'ENTRY' | 'EXIT') => Promise<void>;
  updateZoneOccupancy: (zoneId: number, countChange: number) => void;
  updateZoneStatus: (zoneId: number, status: string) => void;
}

export const useDestinationStore = create<AppState>((set, get) => ({
  categories: [],
  loading: true,
  simulationMode: false,
  fetchData: async () => {
    set({ loading: true });
    const data = await api.getCategoriesSummary();
    set({ categories: data, loading: false });
  },
  toggleSimulation: () => {
    set((state) => ({ simulationMode: !state.simulationMode }));
  },
  triggerSimulatedScan: async (gatewayId, zoneId, type) => {
    const change = type === 'ENTRY' ? 1 : -1;
    
    // Optimistic update
    get().updateZoneOccupancy(zoneId, change);
    
    const result = await api.triggerFastagWebhook(gatewayId, change, type);
    
    // If backend returns actual update, we can replace optimist. For now just sync.
    if (result.updated_zone && !get().simulationMode) {
      // In real scenario we might overwrite with true state
    }
  },
  updateZoneOccupancy: (zoneId, countChange) => {
    set((state) => ({
      categories: state.categories.map(cat => {
        let catChanged = false;
        const newZones = cat.zones.map(z => {
          if (z.id === zoneId) {
            catChanged = true;
            return { ...z, current_occupancy: Math.max(0, z.current_occupancy + countChange) };
          }
          return z;
        });
        if (catChanged) {
          const totalOcc = newZones.reduce((sum, z) => sum + z.current_occupancy, 0);
          return { ...cat, zones: newZones, total_occupancy: totalOcc };
        }
        return cat;
      })
    }));
  },
  updateZoneStatus: (zoneId, status) => {
     set((state) => ({
      categories: state.categories.map(cat => ({
        ...cat,
        zones: cat.zones.map(z => z.id === zoneId ? { ...z, status } : z)
      }))
     }));
  }
}));
