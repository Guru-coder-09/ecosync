import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { LogOut, Leaf, Clock, ChevronRight, FileText } from 'lucide-react';
import { api, PermitRecord } from '../lib/api';

// Zone cards with background gradient colors and icons
const ZONE_CARDS = [
  {
    id: 2,
    name: 'Nilgiris / Ooty',
    state: 'Tamil Nadu',
    emoji: '🌿',
    gradient: 'from-emerald-800 to-green-600',
    description: 'The Queen of Hill Stations',
    quota: '3,000 vehicles/day',
    status: 'OPEN',
  },
  {
    id: 7,
    name: 'Kodaikanal',
    state: 'Tamil Nadu',
    emoji: '🌫',
    gradient: 'from-slate-700 to-blue-700',
    description: 'Princess of Hill Stations',
    quota: '2,500 vehicles/day',
    status: 'OPEN',
  },
  {
    id: 5,
    name: 'Mudumalai Tiger Reserve',
    state: 'Tamil Nadu',
    emoji: '🐘',
    gradient: 'from-amber-800 to-yellow-700',
    description: 'Wildlife Sanctuary & Biosphere',
    quota: '500 vehicles/day',
    status: 'OPEN',
  },
  {
    id: 3,
    name: 'Shimla & Himachal',
    state: 'Himachal Pradesh',
    emoji: '🏔',
    gradient: 'from-sky-700 to-indigo-600',
    description: 'Summer Capital of British India',
    quota: '4,000 vehicles/day',
    status: 'RESTRICTED',
  },
  {
    id: 4,
    name: 'Rohtang & Solang Valley',
    state: 'Himachal Pradesh',
    emoji: '❄️',
    gradient: 'from-blue-900 to-slate-600',
    description: 'High-Altitude Snow Pass (3,978m)',
    quota: '1,200 vehicles/day',
    status: 'RESTRICTED',
  },
  {
    id: 6,
    name: 'Corbett National Park',
    state: 'Uttarakhand',
    emoji: '🌳',
    gradient: 'from-green-800 to-teal-700',
    description: 'India\'s First National Park',
    quota: '800 vehicles/day',
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
      <div className="bg-[#1A237E] text-white text-center py-5 border-b border-indigo-900">
        <p className="text-xs text-blue-300 mb-1">🏛 भारत सरकार · GOVERNMENT OF INDIA &nbsp;|&nbsp; Ministry of Environment, Forest &amp; Climate Change</p>
        <h1 className="text-xl font-extrabold tracking-tight">EcoSync E-Pass Portal — ஈ-பாஸ் போர்டல்</h1>
        <p className="text-sm text-blue-300 mt-1">Ecologically Sensitive Zone (ESZ) Entry Permit System</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Destination chooser title */}
        <div className="text-center mb-8">
          <p className="text-gray-500 text-sm mb-1">நீங்கள் செல்ல விரும்பும் இடம்</p>
          <h2 className="text-2xl font-extrabold text-gray-800">Choose your Destination</h2>
          <p className="text-gray-500 text-sm mt-1">Select an Ecologically Sensitive Zone to apply for an entry permit</p>
        </div>

        {/* Zone Cards Grid */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {ZONE_CARDS.map((zone) => (
            <button
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              className={`relative overflow-hidden rounded-xl text-left text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl active:scale-95 ${
                zone.status === 'LOCKDOWN' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${zone.gradient} opacity-90`} />

              {/* Noise texture overlay */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="relative p-5 min-h-[140px] flex flex-col justify-between">
                <div>
                  <span className="text-3xl">{zone.emoji}</span>
                  <div className="mt-2">
                    <p className="font-extrabold text-lg leading-tight">{zone.name}</p>
                    <p className="text-xs text-white/70 mt-0.5">{zone.state}</p>
                    <p className="text-xs text-white/60 mt-1">{zone.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    zone.status === 'OPEN' ? 'bg-green-500/30 text-green-100' :
                    zone.status === 'RESTRICTED' ? 'bg-orange-500/30 text-orange-100' :
                    'bg-red-500/30 text-red-100'
                  }`}>
                    {zone.status}
                  </span>
                  <span className="text-[10px] text-white/60">{zone.quota}</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="absolute top-3 right-3 opacity-60">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        {/* Info notice — matching TN ePass */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6 text-sm text-amber-800">
          <span className="text-lg">ℹ️</span>
          <p>
            If your District Administration and RTO have approved an exemption pass for a local vehicle,
            it will be available in the <strong>Previous Passes</strong> section below.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePreviousPasses}
            className="bg-purple-700 hover:bg-purple-800 text-white rounded-xl p-5 text-center font-bold transition-colors shadow"
          >
            <FileText className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">முந்தைய பாஸ்கள்</p>
            <p className="text-xs font-normal opacity-80 mt-0.5">Previous Passes &amp; Pending Applications</p>
          </button>

          <button
            onClick={() => navigate('/tourist')}
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl p-5 text-center font-bold transition-colors shadow"
          >
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm">Live Zone Status</p>
            <p className="text-xs font-normal opacity-80 mt-0.5">Real-time Capacity &amp; Weather Map</p>
          </button>
        </div>

        {/* Previous Passes Drawer */}
        {showPrevious && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-sm">Your Previous Passes</h3>
              <button onClick={() => setShowPrevious(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕ Close</button>
            </div>
            <div className="p-4">
              {loadingPermits ? (
                <p className="text-sm text-gray-400 text-center py-4">Loading passes…</p>
              ) : permits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No previous passes found.</p>
                  <p className="text-gray-300 text-xs mt-1">Apply for a new permit by choosing a destination above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {permits.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{p.vehicle_reg_number}</p>
                        <p className="text-xs text-gray-500">{p.zone_name} · {p.passenger_count} passengers</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.status === 'ISSUED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
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
