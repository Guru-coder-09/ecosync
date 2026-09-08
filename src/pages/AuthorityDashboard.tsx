import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { useDestinationStore } from '../stores/destinationStore';
import { api, PermitRecord, TransportFlow } from '../lib/api';
import { 
  Shield, AlertTriangle, Users, Settings2, Power, Filter, 
  Train, Bus, Car, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, LogOut
} from 'lucide-react';

export const AuthorityDashboard = () => {
  const navigate = useNavigate();
  const { userName, badgeId, logout } = useAuthRoleStore();
  const { categories, fetchData, updateZoneStatus } = useDestinationStore();
  const [filterState, setFilterState] = useState('All');
  const [killSwitchModal, setKillSwitchModal] = useState<number | null>(null);

  // New states for Passenger / Vehicle audit log and Multimodal Transport flow
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [transportFlow, setTransportFlow] = useState<TransportFlow | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRANSPORT' | 'PERMITS'>('OVERVIEW');

  useEffect(() => {
    fetchData();
    // Load permits and transport flow
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
    cat.zones.forEach(z => {
      activeNodes += z.gateways.length;
    });
  });

  const filteredZones = allZones.filter(z => filterState === 'All' || z.state === filterState);

  const totalRailPassengers = transportFlow?.railway.reduce((sum, r) => sum + r.passengers_today, 0) || 6050;
  const totalBusPassengers = transportFlow?.buses.reduce((sum, b) => sum + b.passengers_today, 0) || 5310;
  const totalVehiclesScanned = transportFlow?.vehicles.total_fastag_scans_today || 8420;

  const handleKillSwitch = (zoneId: number) => {
    updateZoneStatus(zoneId, 'LOCKDOWN');
    setKillSwitchModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-16">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Shield className="text-emerald-400 w-8 h-8" />
            <div>
              <h1 className="text-xl font-bold tracking-wide">EcoSync Command Center</h1>
              <p className="text-xs text-slate-400">DPI National Carrying Capacity &amp; Multimodal Inflow Authority</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'OVERVIEW' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Zone Matrix
              </button>
              <button
                onClick={() => setActiveTab('TRANSPORT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'TRANSPORT' ? 'bg-blue-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Multimodal Inflow
              </button>
              <button
                onClick={() => setActiveTab('PERMITS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'PERMITS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Passenger Ledger ({permits.length})
              </button>
            </div>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-700">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-tight">{userName || 'Environmental Officer'}</p>
                <p className="text-[10px] text-emerald-400 font-mono">{badgeId || 'MOEFCC-701'}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-950/40 hover:bg-red-900/60 text-red-300 transition-all border border-red-800/50"
              >
                <LogOut className="w-3.5 h-3.5" /> Exit
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Active Headcount</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{totalHeadcount.toLocaleString()}</h2>
              <span className="text-[11px] text-slate-400">Aggregated real-time</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Settings2 className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">System Load</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">
                {((totalHeadcount / (totalCapacity || 1)) * 100).toFixed(1)}%
              </h2>
              <span className="text-[11px] text-slate-400">{totalCapacity.toLocaleString()} safe limit</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <Train className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rail / Bus Flow</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{(totalRailPassengers + totalBusPassengers).toLocaleString()}</h2>
              <span className="text-[11px] text-purple-600 font-medium">Public Transit Inflow</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Car className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">FASTag RFID Today</p>
              <h2 className="text-2xl font-bold text-slate-900 mt-0.5">{totalVehiclesScanned.toLocaleString()}</h2>
              <span className="text-[11px] text-amber-700 font-medium">{activeNodes} Gates Online</span>
            </div>
          </div>
        </div>

        {/* TAB 1: ZONE MATRIX */}
        {activeTab === 'OVERVIEW' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/70">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Zone Carrying Capacity Matrix</h3>
                <p className="text-xs text-slate-500">Live occupancy monitoring and emergency containment control</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select 
                  className="border-slate-300 rounded-lg text-xs font-semibold p-2 focus:ring-emerald-500 outline-none border bg-white shadow-xs"
                  value={filterState}
                  onChange={(e) => setFilterState(e.target.value)}
                >
                  {states.map(s => <option key={s} value={s}>{s === 'All' ? 'All States' : s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Zone Name</th>
                    <th className="px-6 py-3 font-semibold">State</th>
                    <th className="px-6 py-3 font-semibold">Live Occupancy</th>
                    <th className="px-6 py-3 font-semibold">Weather Advisory</th>
                    <th className="px-6 py-3 font-semibold">Safe Capacity</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Containment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredZones.map(zone => {
                    const isCritical = zone.current_occupancy >= zone.safe_capacity;
                    const isYield = zone.status === 'YIELD_REROUTE';
                    const isLockdown = zone.status === 'LOCKDOWN';
                    
                    return (
                      <tr key={zone.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{zone.name}</td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{zone.state}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={isCritical ? 'text-red-600 font-bold' : 'text-emerald-700 font-semibold'}>
                              {zone.current_occupancy.toLocaleString()}
                            </span>
                            {isCritical && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {zone.weather ? (
                            <span className="text-xs text-slate-600">
                              <b>{zone.weather.temp}</b> ({zone.weather.condition})
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            defaultValue={zone.safe_capacity} 
                            className="w-24 border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-slate-50 focus:bg-white focus:ring-1 outline-none font-semibold"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide
                            ${isLockdown ? 'bg-red-100 text-red-800' : 
                              isYield ? 'bg-orange-100 text-orange-800' : 'bg-emerald-100 text-emerald-800'}`}>
                            {zone.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => setKillSwitchModal(zone.id)}
                            disabled={isLockdown}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all
                              ${isLockdown ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 shadow-sm active:scale-95'}`}
                          >
                            <Power className="w-3.5 h-3.5" /> HAZARD LOCK
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MULTIMODAL INFLOW (RAILWAY, BUSES, FASTAG VEHICLES) */}
        {activeTab === 'TRANSPORT' && (
          <div className="space-y-6">
            {/* FASTag Highway & RFID Velocity Metrics */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
                <Car className="text-blue-600 w-5 h-5" />
                FASTag Highway &amp; Checkpost Vehicle Velocity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50/70 border border-blue-100 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-blue-900">
                    <span className="text-xs font-semibold uppercase">Hourly Inflow Rate</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-blue-950 mt-1">
                    {transportFlow?.vehicles.hourly_entry_velocity || 412}
                    <span className="text-xs font-normal text-slate-500"> vehicles/hr</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Real-time gate telemetry</p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="text-xs font-semibold uppercase">Hourly Outflow Rate</span>
                    <ArrowDownRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 mt-1">
                    {transportFlow?.vehicles.hourly_exit_velocity || 385}
                    <span className="text-xs font-normal text-slate-500"> vehicles/hr</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Net delta: +27 vehicles/hr accumulating</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
                  <div className="flex justify-between items-center text-amber-900">
                    <span className="text-xs font-semibold uppercase">Avg Mountain Dwell Time</span>
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-3xl font-extrabold text-amber-950 mt-1">
                    {transportFlow?.vehicles.avg_dwell_time_hours || 4.2}
                    <span className="text-xs font-normal text-slate-500"> Hours</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Measured from Entry to Exit FASTag gate</p>
                </div>
              </div>
            </div>

            {/* Railway & Mountain Toy Trains */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
                <Train className="text-purple-600 w-5 h-5" />
                Heritage Mountain Railway &amp; Passenger Rail Inflow
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {transportFlow?.railway.map((r, i) => (
                  <div key={i} className="border border-slate-200 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <h4 className="font-bold text-sm text-slate-900">{r.route}</h4>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-bold">
                          {r.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{r.active_trains} Active Rakes / Trains</p>
                      
                      <div className="mt-3">
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span>Capacity Load</span>
                          <span>{r.capacity_utilization}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${r.capacity_utilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-right mt-3 font-bold text-slate-800">
                      {r.passengers_today.toLocaleString()} Passengers today
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* State Road Transport Buses */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 mb-4">
                <Bus className="text-emerald-600 w-5 h-5" />
                State Transport (ST) &amp; Commercial Bus Corridors
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {transportFlow?.buses.map((b, i) => (
                  <div key={i} className="border border-slate-200 p-4 rounded-xl bg-slate-50/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm text-slate-900">{b.operator}</h4>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        {b.status}
                      </span>
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

        {/* TAB 3: VEHICLE & PASSENGER MANIFEST */}
        {activeTab === 'PERMITS' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-slate-50/80 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Vehicle &amp; Passenger Manifest</h3>
                <p className="text-xs text-slate-500">Live checkpost entries, license plates, and passenger loads</p>
              </div>
              <button
                onClick={() => api.getPermits().then(setPermits)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                Refresh Manifest
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Permit #</th>
                    <th className="px-6 py-3 font-semibold">Vehicle Plate</th>
                    <th className="px-6 py-3 font-semibold">Category / Type</th>
                    <th className="px-6 py-3 font-semibold">Passenger Count</th>
                    <th className="px-6 py-3 font-semibold">Destination Zone</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                        No active permits issued yet. Issue an Entry Permit from the Tourist Portal to inspect.
                      </td>
                    </tr>
                  ) : (
                    permits.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-slate-700">#{p.id}</td>
                        <td className="px-6 py-3.5">
                          <span className="inline-block bg-amber-50 text-slate-900 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold text-xs tracking-wider shadow-2xs">
                            {p.vehicle_reg_number}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 font-medium">
                          {p.vehicle_type || 'Private Vehicle'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                            <Users className="w-3.5 h-3.5 text-slate-500" />
                            {p.passenger_count} Pax
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs font-medium text-slate-800">
                          {p.zone_name} <span className="text-slate-400">({p.zone_state})</span>
                        </td>
                        <td className="px-6 py-3.5">
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
      </main>

      {/* Kill Switch Modal */}
      {killSwitchModal && (
        <div className="fixed inset-0 bg-red-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
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
