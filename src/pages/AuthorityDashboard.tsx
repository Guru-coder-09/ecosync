import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { useDestinationStore } from '../stores/destinationStore';
import { api, PermitRecord, TransportFlow } from '../lib/api';
import {
  Shield, AlertTriangle, Users, Settings2, Power, Filter,
  Train, Bus, Car, ArrowUpRight, ArrowDownRight, Clock,
  CheckCircle2, LogOut, Leaf, Radio, Wifi
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
function statusBadge(status: string, ratio: number) {
  if (status === 'LOCKDOWN') return { label: 'CLOSED', cls: 'bg-red-100 text-red-700 border border-red-300' };
  if (status === 'YIELD_REROUTE' || ratio >= 0.85) return { label: 'RESTRICTED', cls: 'bg-orange-100 text-orange-700 border border-orange-300' };
  return { label: 'OPEN', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' };
}

function hazardBadge(ratio: number, status: string) {
  if (status === 'LOCKDOWN') return { label: 'LOCKDOWN', cls: 'bg-red-100 text-red-700 border border-red-300' };
  if (ratio >= 0.9) return { label: 'WARNING', cls: 'bg-yellow-100 text-yellow-800 border border-yellow-300' };
  return { label: 'NORMAL', cls: 'bg-teal-100 text-teal-700 border border-teal-300' };
}

// ─── Mock live scan feed ──────────────────────────────────────────────────────
const MOCK_SCAN_FEED = [
  { time: '08:49 pm IST', zone: 'Kedarnath Wildlife…', type: 'ENTRY', verified: true, failure: '—', sync: 'Online' },
  { time: '10:49 pm IST', zone: 'Mudumalai Tiger R…', type: 'ENTRY', verified: false, failure: 'CLOCK DRIFT', sync: 'Online' },
  { time: '11:12 pm IST', zone: 'Great Himalayan N…', type: 'EXIT', verified: true, failure: '—', sync: 'Online' },
  { time: '11:47 pm IST', zone: 'Sundarbans Bio…', type: 'ENTRY', verified: true, failure: '—', sync: 'Offline' },
];

export const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const { userName, badgeId, logout } = useAuthRoleStore();
  const { categories, fetchData, updateZoneStatus } = useDestinationStore();
  const [filterState, setFilterState] = useState('All');
  const [killSwitchModal, setKillSwitchModal] = useState<number | null>(null);
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [transportFlow, setTransportFlow] = useState<TransportFlow | null>(null);
  const queryParams = new URLSearchParams(window.location.search);
  const initialTab = (queryParams.get('tab')?.toUpperCase() as 'OVERVIEW' | 'TRANSPORT' | 'PERMITS') || 'OVERVIEW';
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRANSPORT' | 'PERMITS'>(initialTab);

  useEffect(() => {
    fetchData();
    api.getPermits().then(setPermits).catch(console.error);
    api.getTransportFlow().then(setTransportFlow).catch(console.error);
  }, [fetchData]);

  // Derived metrics
  let totalHeadcount = 0;
  let totalCapacity = 0;
  let activeNodes = 0;
  const allZones = categories.flatMap(cat => cat.zones);
  const states = ['All', ...Array.from(new Set(allZones.map(z => z.state)))];

  categories.forEach(cat => {
    totalHeadcount += cat.total_occupancy;
    totalCapacity += cat.total_capacity;
    cat.zones.forEach(z => { activeNodes += z.gateways.length; });
  });

  const filteredZones = allZones.filter(z => filterState === 'All' || z.state === filterState);
  const zonesAtRisk = allZones.filter(z => {
    const r = z.current_occupancy / (z.safe_capacity || 1);
    return r >= 0.85 || z.status === 'LOCKDOWN';
  }).length;

  const avgUtilization = totalCapacity > 0 ? ((totalHeadcount / totalCapacity) * 100) : 0;
  const totalRailPassengers = transportFlow?.railway.reduce((sum, r) => sum + r.passengers_today, 0) || 6050;
  const totalBusPassengers = transportFlow?.buses.reduce((sum, b) => sum + b.passengers_today, 0) || 5310;
  const totalVehiclesScanned = transportFlow?.vehicles.total_fastag_scans_today || 8420;

  const handleKillSwitch = (zoneId: number) => {
    updateZoneStatus(zoneId, 'LOCKDOWN');
    setKillSwitchModal(null);
  };

  const now = new Date();
  const timeIST = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
  const dateIST = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="bg-[#1A237E] text-white flex items-center justify-between px-5 py-2.5 shadow-md">
        {/* Left: Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight tracking-wide">EcoSync</p>
            <p className="text-[9px] text-blue-200 leading-tight">GoI Digital Public Infrastructure</p>
          </div>
        </div>

        {/* Center: Tab bar */}
        <div className="flex gap-1">
          {(['OVERVIEW', 'TRANSPORT', 'PERMITS'] as const).map((tab) => {
            const labels: Record<string, string> = {
              OVERVIEW: '🗺 Command Dashboard',
              TRANSPORT: '🚆 Multimodal Inflow',
              PERMITS: `📋 Passenger Ledger (${permits.length})`,
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                  activeTab === tab
                    ? 'bg-white text-[#1A237E]'
                    : 'text-blue-200 hover:text-white hover:bg-white/15'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⚠ DEMO
          </span>
          <Wifi className="w-4 h-4 text-blue-300 hidden sm:block" />
          <span className="text-xs font-semibold hidden sm:block">{userName || 'Dr. Ananya Nair'}</span>
          <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Authority</span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="ml-1 p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </nav>

      {/* ── Authority Red Header ─────────────────────────────────────── */}
      <div
        className="text-white px-5 pt-4 pb-5"
        style={{ background: 'linear-gradient(135deg, #B71C1C 0%, #1A237E 60%, #0D47A1 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-xl shrink-0">
              🛡
            </div>
            <div>
              <p className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">सर्वश्रेष्ठ राष्ट्रे</p>
              <h1 className="text-2xl font-extrabold leading-tight">EcoSync Authority</h1>
              <p className="text-xs text-blue-200 mt-0.5">National Disaster Management Authority · GoI DPI Ecological Permit System</p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs text-blue-200">🕐 {dateIST}, {timeIST} IST</p>
            <p className="text-[11px] text-blue-300 mt-0.5">Logged in as {badgeId || 'authority@demo.ecosync.in'}</p>
            <span className="inline-block mt-1 bg-red-700/60 border border-red-400/40 text-red-100 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Authority Access
            </span>
          </div>
        </div>
      </div>

      {/* ── Legal Notice Ticker ─────────────────────────────────────── */}
      <div className="bg-[#1A237E] border-t border-blue-800 px-5 py-1.5 flex items-center gap-2 overflow-hidden">
        <span className="text-yellow-400 text-[10px] font-bold uppercase tracking-wider shrink-0">⚠ Legal Notice:</span>
        <p className="text-[10px] text-blue-100 whitespace-nowrap overflow-hidden text-ellipsis">
          This system is authorised under the{' '}
          <span className="font-semibold text-yellow-300">Environment Protection Act, 1986</span>{' '}
          and the{' '}
          <span className="font-semibold text-yellow-300">Disaster Management Act, 2005</span>.{' '}
          Unauthorised access is a punishable offence. All actions are logged and audited.
        </p>
      </div>

      {/* ── KPI Bar ─────────────────────────────────────────────────── */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-blue-500 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-tight">Total Active Headcount</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-none">{totalHeadcount.toLocaleString()}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Across {allZones.length} registered zones</p>
          </div>
        </div>

        {/* Avg Capacity */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-teal-500 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-teal-50 rounded-lg">
            <Settings2 className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-tight">Avg Capacity Utilisation</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-none">{avgUtilization.toFixed(1)}%</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Normal — within safe limits</p>
          </div>
        </div>

        {/* FASTag */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-orange-500 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-orange-50 rounded-lg">
            <Radio className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-tight">Active FASTag Gateways</p>
            <h2 className="text-2xl font-extrabold text-orange-500 mt-0.5 leading-none">{activeNodes}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">electronic toll &amp; permit scanning nodes</p>
          </div>
        </div>

        {/* At Risk */}
        <div className="bg-white rounded-xl shadow-sm border-l-4 border-red-500 p-4 flex items-center gap-4">
          <div className="p-2.5 bg-red-50 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider leading-tight">Zones at Risk</p>
            <h2 className="text-2xl font-extrabold text-red-500 mt-0.5 leading-none">{zonesAtRisk}</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">{zonesAtRisk} zones need attention</p>
          </div>
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        {/* ── TAB 1: OVERVIEW — Zone Control Panel ── */}
        {activeTab === 'OVERVIEW' && (
          <div className="flex gap-5">
            {/* Left: Zone Control Panel table */}
            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">ZONE CONTROL PANEL</h3>
                  <p className="text-[11px] text-slate-500">{filteredZones.length} of {allZones.length} zones shown</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {states.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                  </select>
                  <div className="flex items-center gap-2 text-[10px] font-bold">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />OPEN</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-orange-500 inline-block" />RESTRICTED</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />CLOSED</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] border-b border-slate-200 font-semibold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Zone Name</th>
                      <th className="px-4 py-3">State</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Hazard</th>
                      <th className="px-4 py-3">Capacity</th>
                      <th className="px-4 py-3">Safe Cap.</th>
                      <th className="px-4 py-3">Occupancy</th>
                      <th className="px-4 py-3">FASTag GW</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredZones.map(zone => {
                      const ratio = zone.current_occupancy / (zone.safe_capacity || 1);
                      const sb = statusBadge(zone.status, ratio);
                      const hb = hazardBadge(ratio, zone.status);
                      const isLockdown = zone.status === 'LOCKDOWN';
                      const isWarning = ratio >= 0.7 && ratio < 0.85;
                      const isCritical = ratio >= 0.85 || isLockdown;

                      return (
                        <tr
                          key={zone.id}
                          className={`transition-colors ${
                            isLockdown ? 'bg-red-50' : isCritical ? 'bg-yellow-50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-900 max-w-[150px] truncate">{zone.name}</td>
                          <td className="px-4 py-3 text-slate-500">{zone.state}</td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sb.cls}`}>{sb.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hb.cls}`}>{hb.label}</span>
                          </td>
                          <td className="px-4 py-3 min-w-[130px]">
                            <div className="flex items-center gap-1 text-[10px] mb-1">
                              <span className={`font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {isCritical ? 'CRITICAL — ' : ratio >= 0.7 ? 'HIGH — ' : 'NORMAL '}
                                {Math.round(ratio * 100)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full ${isCritical ? 'bg-red-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(100, ratio * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              defaultValue={zone.safe_capacity}
                              className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-xs bg-slate-50 focus:bg-white focus:ring-1 outline-none font-semibold"
                            />
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-800">{zone.current_occupancy.toLocaleString()}</td>
                          <td className="px-4 py-3 text-slate-600">{zone.gateways.length}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setKillSwitchModal(zone.id)}
                              disabled={isLockdown}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white transition-all
                                ${isLockdown ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm active:scale-95'}`}
                            >
                              <Power className="w-3 h-3" /> LOCK
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Zone Map + Live Scan Feed */}
            <div className="w-72 shrink-0 space-y-4">
              {/* Zone Map placeholder */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">ZONE MAP</h3>
                </div>
                <div className="h-48 bg-slate-100 flex items-center justify-center text-slate-300">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🗺</div>
                    <p className="text-xs font-medium text-slate-400">PostGIS Map Placeholder</p>
                    <p className="text-[10px] text-slate-300">Live zone heatmap via MapTiler</p>
                  </div>
                </div>
              </div>

              {/* Live Scan Feed */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900">LIVE SCAN FEED</h3>
                  </div>
                  <span className="text-[10px] text-slate-400">Live · {MOCK_SCAN_FEED.length} of {MOCK_SCAN_FEED.length} entries</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="px-2 py-2 text-left font-semibold uppercase">Time (IST)</th>
                        <th className="px-2 py-2 text-left font-semibold uppercase">Zone</th>
                        <th className="px-2 py-2 text-left font-semibold uppercase">Type</th>
                        <th className="px-2 py-2 text-center font-semibold uppercase">✓</th>
                        <th className="px-2 py-2 text-left font-semibold uppercase">Failure</th>
                        <th className="px-2 py-2 text-left font-semibold uppercase">Sync</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {MOCK_SCAN_FEED.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-2 py-2 font-mono text-slate-600">{row.time}</td>
                          <td className="px-2 py-2 text-slate-700 truncate max-w-[80px]">{row.zone}</td>
                          <td className="px-2 py-2">
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[9px] ${row.type === 'ENTRY' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                              {row.type}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {row.verified
                              ? <span className="text-emerald-600 font-bold">✓</span>
                              : <span className="text-red-500 font-bold">✗</span>}
                          </td>
                          <td className="px-2 py-2">
                            {row.failure !== '—'
                              ? <span className="text-orange-600 font-bold text-[9px]">{row.failure}</span>
                              : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-2 py-2">
                            <span className={`font-bold text-[9px] ${row.sync === 'Online' ? 'text-emerald-600' : 'text-red-500'}`}>
                              ● {row.sync}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: MULTIMODAL TRANSPORT ── */}
        {activeTab === 'TRANSPORT' && (
          <div className="space-y-5">
            {/* FASTag velocity */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                <Car className="text-blue-600 w-4 h-4" />
                FASTag Highway &amp; Checkpost Vehicle Velocity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-blue-900 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Hourly Inflow Rate</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-blue-950">
                    {transportFlow?.vehicles.hourly_entry_velocity || 412}
                    <span className="text-xs font-normal text-slate-500"> vehicles/hr</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Real-time gate telemetry</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-slate-700 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Hourly Outflow Rate</span>
                    <ArrowDownRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">
                    {transportFlow?.vehicles.hourly_exit_velocity || 385}
                    <span className="text-xs font-normal text-slate-500"> vehicles/hr</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Net delta: +27 vehicles/hr accumulating</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-amber-900 mb-1">
                    <span className="text-[11px] font-semibold uppercase">Avg Mountain Dwell Time</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-950">
                    {transportFlow?.vehicles.avg_dwell_time_hours || 4.2}
                    <span className="text-xs font-normal text-slate-500"> Hours</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Measured from Entry to Exit FASTag gate</p>
                </div>
              </div>
            </div>

            {/* Railway */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                <Train className="text-purple-600 w-4 h-4" />
                Heritage Mountain Railway &amp; Passenger Rail Inflow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {transportFlow?.railway.map((r, i) => (
                  <div key={i} className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h4 className="font-bold text-sm text-slate-900">{r.route}</h4>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">{r.status}</span>
                    </div>
                    <p className="text-xs text-slate-500">{r.active_trains} Active Rakes / Trains</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Capacity Load</span>
                        <span>{r.capacity_utilization}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${r.capacity_utilization}%` }} />
                      </div>
                    </div>
                    <p className="text-xs text-right mt-3 font-bold text-slate-800">{r.passengers_today.toLocaleString()} Passengers today</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Buses */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
                <Bus className="text-emerald-600 w-4 h-4" />
                State Transport (ST) &amp; Commercial Bus Corridors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {transportFlow?.buses.map((b, i) => (
                  <div key={i} className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-slate-900">{b.operator}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">{b.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Destination: {b.target_zone}</p>
                    <div className="mt-3 flex justify-between items-center text-xs">
                      <span className="text-slate-600">Active Bus Fleet:</span>
                      <span className="font-bold font-mono text-slate-900">{b.active_fleet} Coaches</span>
                    </div>
                    <div className="mt-1 flex justify-between items-center text-xs">
                      <span className="text-slate-600">Daily Commuters:</span>
                      <span className="font-bold text-emerald-700">{b.passengers_today.toLocaleString()} pax</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: PASSENGER LEDGER ── */}
        {activeTab === 'PERMITS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Vehicle &amp; Passenger Manifest</h3>
                <p className="text-xs text-slate-500">Live checkpost entries, license plates, and passenger loads</p>
              </div>
              <button
                onClick={() => api.getPermits().then(setPermits)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
              >
                Refresh Manifest
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Permit #</th>
                    <th className="px-5 py-3 font-semibold">Vehicle Plate</th>
                    <th className="px-5 py-3 font-semibold">Category / Type</th>
                    <th className="px-5 py-3 font-semibold">Passenger Count</th>
                    <th className="px-5 py-3 font-semibold">Destination Zone</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                        No active permits. Issue one from the Tourist Portal to inspect.
                      </td>
                    </tr>
                  ) : (
                    permits.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-700">#{p.id}</td>
                        <td className="px-5 py-3.5">
                          <span className="bg-amber-50 text-slate-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-xs tracking-wider">
                            {p.vehicle_reg_number}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">{p.vehicle_type || 'Private Vehicle'}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {p.passenger_count} Pax
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-medium text-slate-800">
                          {p.zone_name} <span className="text-slate-400">({p.zone_state})</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full
                            ${p.status === 'VERIFIED_ENTRY' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Kill Switch Modal ────────────────────────────────────────── */}
      {killSwitchModal && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border-t-4 border-red-600">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="font-bold text-xl">Confirm Hazard Lockdown</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              You are about to initiate an emergency lockdown for this zone.
              All inbound FASTag gates will reject entry permits. Reroute protocols will activate immediately.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setKillSwitchModal(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleKillSwitch(killSwitchModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 shadow-lg shadow-red-200"
              >
                EXECUTE LOCKDOWN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
