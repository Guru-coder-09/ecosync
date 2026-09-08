export interface Gateway {
  id: number;
  zone_id: number;
  name: string;
  gateway_type: string;
}

export interface TouristSpot {
  id: number;
  zone_id: number;
  name: string;
  current_crowd: number;
  max_capacity: number;
  status: string;
}

export interface WeatherInfo {
  temp: string;
  condition: string;
  humidity: string;
  wind: string;
  alert?: string;
}

export interface Zone {
  id: number;
  category_id: number;
  name: string;
  state: string;
  safe_capacity: number;
  current_occupancy: number;
  hazard_level: string;
  status: string;
  gateways: Gateway[];
  spots?: TouristSpot[];
  weather?: WeatherInfo;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  total_capacity: number;
  total_occupancy: number;
  zones: Zone[];
}

export interface PermitRecord {
  id: number;
  zone_id: number;
  zone_name: string;
  zone_state: string;
  vehicle_reg_number: string;
  vehicle_type: string;
  passenger_count: number;
  slot_start: number;
  slot_end: number;
  status: string;
}

export interface TransportFlow {
  railway: {
    route: string;
    active_trains: number;
    passengers_today: number;
    capacity_utilization: number;
    status: string;
  }[];
  buses: {
    operator: string;
    active_fleet: number;
    passengers_today: number;
    target_zone: string;
    status: string;
  }[];
  vehicles: {
    total_fastag_scans_today: number;
    hourly_entry_velocity: number;
    hourly_exit_velocity: number;
    avg_dwell_time_hours: number;
  };
}

const API_BASE = 'http://localhost:8000/api';

const MOCK_DATA: Category[] = [
  {
    id: 1,
    name: "Hill Stations",
    description: "Elevated tourist destinations",
    total_capacity: 12000,
    total_occupancy: 10600,
    zones: [
      {
        id: 1, category_id: 1, name: "Lonavala", state: "Maharashtra", safe_capacity: 5000, current_occupancy: 4200, hazard_level: "NORMAL", status: "OPEN",
        gateways: [{ id: 1, zone_id: 1, name: "Khandala Ghat FASTag Toll", gateway_type: "FASTAG_TOLL" }, { id: 2, zone_id: 1, name: "Tiger Point Barrier", gateway_type: "MANUAL_CHECKPOST" }],
        weather: { temp: "21°C", condition: "Heavy Mist & Rain", humidity: "92%", wind: "18 km/h", alert: "Ghat Landslide Warning" },
        spots: [
          { id: 1, zone_id: 1, name: "Tiger Point (Lion's Point)", current_crowd: 380, max_capacity: 400, status: "HIGH_DENSITY" },
          { id: 2, zone_id: 1, name: "Bhushi Dam Cascades", current_crowd: 510, max_capacity: 600, status: "MODERATE" },
          { id: 3, zone_id: 1, name: "Karla & Bhaja Buddhist Caves", current_crowd: 130, max_capacity: 300, status: "LOW_DENSITY" }
        ]
      },
      {
        id: 2, category_id: 1, name: "Ooty", state: "Tamil Nadu", safe_capacity: 3000, current_occupancy: 2600, hazard_level: "ELEVATED", status: "OPEN",
        gateways: [{ id: 3, zone_id: 2, name: "Ooty Main Toll", gateway_type: "FASTAG_TOLL" }],
        weather: { temp: "14°C", condition: "Dense Fog / Chilly", humidity: "88%", wind: "10 km/h", alert: "Low Visibility on Hairpin Bends" },
        spots: [
          { id: 4, zone_id: 2, name: "Government Botanical Garden", current_crowd: 640, max_capacity: 800, status: "MODERATE" },
          { id: 5, zone_id: 2, name: "Doddabetta Mountain Peak", current_crowd: 360, max_capacity: 400, status: "HIGH_DENSITY" },
          { id: 6, zone_id: 2, name: "Pykara Lake & Waterfalls", current_crowd: 190, max_capacity: 500, status: "LOW_DENSITY" }
        ]
      },
      {
        id: 3, category_id: 1, name: "Shimla", state: "Himachal Pradesh", safe_capacity: 4000, current_occupancy: 3800, hazard_level: "HIGH", status: "YIELD_REROUTE",
        gateways: [],
        weather: { temp: "16°C", condition: "Pleasant / Clear", humidity: "55%", wind: "8 km/h", alert: "Normal Mountain Weather" },
        spots: [
          { id: 7, zone_id: 3, name: "The Ridge & Mall Road", current_crowd: 1180, max_capacity: 1200, status: "CRITICAL" },
          { id: 8, zone_id: 3, name: "Jakhoo Temple & Ropeway", current_crowd: 320, max_capacity: 500, status: "MODERATE" },
          { id: 9, zone_id: 3, name: "Kufri Adventure Highland", current_crowd: 460, max_capacity: 600, status: "MODERATE" }
        ]
      }
    ]
  },
  {
    id: 2,
    name: "High-Altitude Passes",
    description: "Mountain passes with fragile ecosystems",
    total_capacity: 1200,
    total_occupancy: 1150,
    zones: [
      {
        id: 4, category_id: 2, name: "Rohtang Pass & Solang Valley", state: "Himachal Pradesh", safe_capacity: 1200, current_occupancy: 1150, hazard_level: "CRITICAL", status: "OPEN",
        gateways: [{ id: 4, zone_id: 4, name: "Gulaba Checkpost", gateway_type: "FASTAG_TOLL" }],
        weather: { temp: "3°C", condition: "Snow / Freezing Gales", humidity: "82%", wind: "32 km/h", alert: "High-Altitude Blizzard Alert" },
        spots: [
          { id: 10, zone_id: 4, name: "Rohtang Glacier Crest", current_crowd: 490, max_capacity: 500, status: "CRITICAL" },
          { id: 11, zone_id: 4, name: "Solang Valley Adventure Bowl", current_crowd: 430, max_capacity: 500, status: "HIGH_DENSITY" },
          { id: 12, zone_id: 4, name: "Atal Tunnel North Portal", current_crowd: 230, max_capacity: 400, status: "LOW_DENSITY" }
        ]
      }
    ]
  },
  {
    id: 3,
    name: "Wildlife & Biosphere",
    description: "Protected natural habitats",
    total_capacity: 1300,
    total_occupancy: 600,
    zones: [
      {
        id: 5, category_id: 3, name: "Mudumalai", state: "Tamil Nadu", safe_capacity: 500, current_occupancy: 200, hazard_level: "NORMAL", status: "OPEN",
        gateways: [],
        weather: { temp: "26°C", condition: "Overcast & Humid", humidity: "79%", wind: "12 km/h", alert: "Elephant Herd Crossing Active" },
        spots: [
          { id: 13, zone_id: 5, name: "Theppakadu Elephant Camp", current_crowd: 95, max_capacity: 150, status: "MODERATE" },
          { id: 14, zone_id: 5, name: "Moyar River Gorge Trail", current_crowd: 65, max_capacity: 100, status: "LOW_DENSITY" }
        ]
      },
      {
        id: 6, category_id: 3, name: "Corbett", state: "Uttarakhand", safe_capacity: 800, current_occupancy: 400, hazard_level: "NORMAL", status: "OPEN",
        gateways: [],
        weather: { temp: "28°C", condition: "Sunny & Dry", humidity: "58%", wind: "6 km/h", alert: "Eco-Safe Jungle Conditions" },
        spots: [
          { id: 15, zone_id: 6, name: "Dhikala Ecotourism Core", current_crowd: 215, max_capacity: 250, status: "HIGH_DENSITY" },
          { id: 16, zone_id: 6, name: "Bijrani Jungle Safari Ring", current_crowd: 145, max_capacity: 250, status: "LOW_DENSITY" }
        ]
      }
    ]
  }
];

export const api = {
  async getCategoriesSummary(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/categories-summary`);
      if (!res.ok) throw new Error('Network response was not ok');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, using mock data for categories', e);
      return MOCK_DATA;
    }
  },

  async getPermits(): Promise<PermitRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/permits`);
      if (!res.ok) throw new Error('Failed to fetch permits');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, returning fallback permits', e);
      return [];
    }
  },

  async getTransportFlow(): Promise<TransportFlow> {
    try {
      const res = await fetch(`${API_BASE}/transport-flow`);
      if (!res.ok) throw new Error('Failed to fetch transport flow');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, returning fallback transport flow', e);
      return {
        railway: [],
        buses: [],
        vehicles: { total_fastag_scans_today: 0, hourly_entry_velocity: 0, hourly_exit_velocity: 0, avg_dwell_time_hours: 0 }
      };
    }
  },

  async triggerFastagWebhook(gatewayId: number, count: number, type: 'ENTRY' | 'EXIT') {
    try {
      const res = await fetch(`${API_BASE}/fastag-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway_id: gatewayId, vehicle_reg: 'SIM-' + Math.floor(Math.random() * 10000), count, type })
      });
      if (!res.ok) throw new Error('Webhook failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, simulating webhook response', e);
      return { status: "simulated_success", updated_zone: null };
    }
  },

  async signPermit(zoneId: number, vehicleReg: string, passengerCount: number, vehicleType: string = 'Private Vehicle') {
    try {
      const res = await fetch(`${API_BASE}/sign-permit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_id: zoneId, vehicle_reg_number: vehicleReg, passenger_count: passengerCount, vehicle_type: vehicleType })
      });
      if (!res.ok) throw new Error('Sign permit failed');
      return await res.json();
    } catch (e) {
      console.warn('Backend unavailable, generating mock token', e);
      return { permit_id: 999, token: "mock.jwt.token", public_key: "mock_pub_key" };
    }
  }
};

// Compatibility exports for legacy stores
export const apiGetPermits = async (..._args: any[]) => [] as any;
export const apiCreatePermit = async (..._args: any[]) => ({} as any);
export const apiSignPermit = async (..._args: any[]) => ({} as any);
export const apiGetScanLogs = async (..._args: any[]) => [] as any;
export const apiCreateScanLog = async (..._args: any[]) => ({} as any);
export const apiGetZones = async (..._args: any[]) => [] as any;
export const apiUpdateZone = async (..._args: any[]) => ({} as any);
export const apiLockdownZone = async (..._args: any[]) => ({} as any);
