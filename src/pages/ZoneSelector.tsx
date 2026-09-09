import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { LogOut, Leaf, Clock, ChevronRight, FileText, Car } from 'lucide-react';
import { api, PermitRecord } from '../lib/api';

// Sleeker, modern card data
const ZONE_CARDS = [
  {
    id: 2,
    name: 'Nilgiris / Ooty',
    state: 'Tamil Nadu',
    emoji: '🌿',
    theme: 'emerald',
    description: 'The Queen of Hill Stations',
    quota: '3,000 / day',
    status: 'OPEN',
  },
  {
    id: 7,
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    emoji: '🌫',
    theme: 'blue',
    description: 'Princess of Hill Stations',
    quota: '2,500 / day',
    status: 'OPEN',
  },
  {
    id: 5,
    name: 'Mudumalai Tiger Reserve',
    state: 'Tamil Nadu',
    emoji: '🐘',
    theme: 'amber',
    description: 'Wildlife Sanctuary & Biosphere',
    quota: '500 / day',
    status: 'OPEN',
  },
  {
    id: 3,
    name: 'Shimla & Himachal',
    state: 'Himachal Pradesh',
    emoji: '🏔',
    theme: 'indigo',
    description: 'Summer Capital of British India',
    quota: '4,000 / day',
    status: 'RESTRICTED',
  },
  {
    id: 4,
    name: 'Rohtang & Solang Valley',
    state: 'Himachal Pradesh',
    emoji: '❄️',
    theme: 'cyan',
    description: 'High-Altitude Snow Pass (3,978m)',
    quota: '1,200 / day',
    status: 'RESTRICTED',
  },
  {
    id: 6,
    name: 'Corbett National Park',
    state: 'Uttarakhand',
    emoji: '🌳',
    theme: 'teal',
    description: 'India\'s First National Park',
    quota: '800 / day',
    status: 'OPEN',
  },
];

export const ZoneSelector = () => {
  const navigate = useNavigate();
  const { userName, logout } = useAuthRoleStore();
  const [permits, setPermits] = useState<PermitRecord[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);
  const [loadingPermits, setLoadingPermits] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleZoneClick = (zone: typeof ZONE_CARDS[0]) => {
    if (zone.status === 'LOCKDOWN') return;
    navigate(`/tourist/apply?zoneId=${zone.id}&zoneName=${encodeURIComponent(zone.name)}&state=${encodeURIComponent(zone.state)}`);
  };

  const fetchMyPermits = async () => {
    setLoadingPermits(true);
    try {
      const all = await api.getPermits();
      setPermits(all);
    } catch {
      setPermits([]);
    } finally {
      setLoadingPermits(false);
    }
  };

  const handlePreviousPasses = () => {
    setShowPrevious(true);
    fetchMyPermits();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navbar */}
      <nav className="bg-[#1A237E] text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-extrabold text-sm">EcoSync</span>
            <span className="text-blue-300 text-xs ml-1.5">GoI Digital Public Infrastructure</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-blue-200">📱 {userName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </nav>

      {/* Government Header Band */}
      <div className="bg-white border-b border-gray-200 py-6 text-center shadow-sm">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Government of India · Ministry of Environment</p>
        <h1 className="text-2xl font-extrabold text-[#1A237E] tracking-tight">EcoSync E-Pass Portal</h1>
        <p className="text-sm text-gray-500 mt-1">Ecologically Sensitive Zone (ESZ) Entry Permit System</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Destination chooser title */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-gray-800">Choose your Destination</h2>
            <p className="text-gray-500 text-sm mt-1">Select a zone to apply for an entry permit</p>
          </div>
        </div>

        {/* Zone Cards Grid - Modern Clean Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {ZONE_CARDS.map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              className={`group flex flex-col bg-white text-left rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                zone.status === 'LOCKDOWN' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* Top Accent Bar */}
              <div className={`h-2 w-full bg-${zone.theme}-500`} />
              
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl border border-gray-100 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                    {zone.emoji}
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    zone.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    zone.status === 'RESTRICTED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {zone.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-extrabold text-gray-900 leading-tight group-hover:text-[#1A237E] transition-colors">{zone.name}</h3>
                <p className="text-xs font-bold text-indigo-600 mt-1">{zone.state}</p>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{zone.description}</p>
              </div>

              {/* Bottom Info Bar */}
              <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-gray-400" /> Max: {zone.quota}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1A237E] transition-colors group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>

        {/* Info notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-6 text-sm text-blue-800 shadow-sm">
          <span className="text-lg">ℹ️</span>
          <p>
            If your District Administration and RTO have approved an exemption pass for a local vehicle,
            it will be available in the <strong>Previous Passes</strong> section below.
          </p>
        </div>

        {/* Action Buttons - Modern sleek variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handlePreviousPasses}
            className="bg-white border border-gray-200 hover:border-[#1A237E] hover:bg-indigo-50/50 rounded-xl p-4 flex items-center gap-4 transition-all shadow-sm text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 transition-colors">
              <FileText className="w-5 h-5 text-[#1A237E]" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 group-hover:text-[#1A237E]">Previous Passes</p>
              <p className="text-xs text-gray-500 mt-0.5">View your pending and approved applications</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/tourist')}
            className="bg-white border border-gray-200 hover:border-teal-600 hover:bg-teal-50/50 rounded-xl p-4 flex items-center gap-4 transition-all shadow-sm text-left group"
          >
            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
              <Clock className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 group-hover:text-teal-700">Live Zone Status</p>
              <p className="text-xs text-gray-500 mt-0.5">Real-time Capacity &amp; Weather Map</p>
            </div>
          </button>
        </div>

        {/* Previous Passes Drawer */}
        {showPrevious && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-extrabold text-gray-800 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600"/> Your Previous Passes
              </h3>
              <button onClick={() => setShowPrevious(false)} className="text-gray-400 hover:text-gray-700 text-xs font-bold transition-colors">✕ Close</button>
            </div>
            <div className="p-4">
              {loadingPermits ? (
                <p className="text-sm text-gray-400 text-center py-6">Loading passes…</p>
              ) : permits.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 font-medium text-sm">No previous passes found.</p>
                  <p className="text-gray-400 text-xs mt-1">Apply for a new permit by choosing a destination above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {permits.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:border-indigo-200 transition-colors">
                      <div>
                        <p className="text-sm font-extrabold text-gray-800 font-mono tracking-wide">{p.vehicle_reg_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{p.zone_name} <span className="mx-1 text-gray-300">•</span> {p.passenger_count} passengers</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider ${
                        p.status === 'ISSUED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
