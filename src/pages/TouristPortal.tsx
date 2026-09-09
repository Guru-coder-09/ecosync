import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { useDestinationStore } from '../stores/destinationStore';
import { api, Zone } from '../lib/api';
import {
  MapPin, ShieldAlert, ArrowRightCircle, QrCode, RefreshCw, CheckCircle,
  ShieldCheck, Car, Users, X, CloudRain, Wind, Droplets, AlertTriangle,
  Compass, ChevronDown, ChevronUp, LogOut, Wifi, Leaf
} from 'lucide-react';
import QRCode from 'qrcode';

// ─── helpers ────────────────────────────────────────────────────────────────
function statusBadge(zone: Zone) {
  const ratio = zone.current_occupancy / (zone.safe_capacity || 1);
  if (zone.status === 'LOCKDOWN') return { label: 'LOCKDOWN', cls: 'bg-red-100 text-red-700 border border-red-300' };
  if (zone.status === 'YIELD_REROUTE' || ratio >= 0.85) return { label: 'RESTRICTED', cls: 'bg-orange-100 text-orange-700 border border-orange-300' };
  if (ratio >= 0.7) return { label: 'WARNING', cls: 'bg-yellow-100 text-yellow-700 border border-yellow-300' };
  return { label: 'OPEN', cls: 'bg-emerald-100 text-emerald-700 border border-emerald-300' };
}

function hazardBadge(zone: Zone) {
  const ratio = zone.current_occupancy / (zone.safe_capacity || 1);
  if (ratio >= 0.9) return { label: 'HIGH DEMAND', cls: 'bg-red-50 text-red-600 border border-red-200' };
  if (ratio >= 0.7) return { label: 'MODERATE', cls: 'bg-amber-50 text-amber-600 border border-amber-200' };
  return { label: 'NORMAL', cls: 'bg-teal-50 text-teal-600 border border-teal-200' };
}

function weatherEmoji(condition: string) {
  const c = condition?.toLowerCase() || '';
  if (c.includes('rain') || c.includes('drizzle')) return '🌧';
  if (c.includes('cloud') || c.includes('overcast')) return '⛅';
  if (c.includes('fog') || c.includes('mist') || c.includes('haze')) return '🌫';
  if (c.includes('snow')) return '❄️';
  if (c.includes('thunder') || c.includes('storm')) return '⛈';
  if (c.includes('wind')) return '💨';
  if (c.includes('sunny') || c.includes('clear')) return '☀️';
  return '🌤';
}

// ─── Mock active passes ──────────────────────────────────────────────────────
const MOCK_ACTIVE_PASSES = [
  {
    id: 'TN-38-AB-1234',
    zone: 'Mudumalai Tiger Reserve',
    validUntil: '09 Sept 2026, 06:52 am IST',
  },
  {
    id: 'DL-01-CD-5678',
    zone: 'Kedarnath Wildlife Sanctuary',
    validUntil: '09 Sept 2026, 02:57 am IST',
  },
];

// ─── Stepper ─────────────────────────────────────────────────────────────────
const STEPS = ['Select Zone', 'Vehicle & Time Slot', 'Eco-Verification', 'Digital E-Pass'];

export const TouristPortal = () => {
  const navigate = useNavigate();
  const { userName, logout } = useAuthRoleStore();
  const { categories, fetchData, loading } = useDestinationStore();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [expandedSpotsZoneId, setExpandedSpotsZoneId] = useState<number | null>(1);

  // Booking form state
  const [vehicleReg, setVehicleReg] = useState('MH 14 DX 4022');
  const [passengers, setPassengers] = useState(2);
  const [vehicleType, setVehicleType] = useState('Private SUV');
  const [issuedPermit, setIssuedPermit] = useState<{ permit_id: number; token: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [currentStep, setCurrentStep] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generatePermit = useCallback(async (zoneId: number) => {
    setIsGenerating(true);
    try {
      const res = await api.signPermit(zoneId, vehicleReg, passengers, vehicleType);
      setIssuedPermit(res);
      setCountdown(30);
    } catch (err) {
      console.error('Failed to sign permit:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [vehicleReg, passengers, vehicleType]);

  useEffect(() => {
    if (issuedPermit?.token && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, issuedPermit.token, {
        width: 220, margin: 2,
        color: { dark: '#1A237E', light: '#FFFFFF' },
        errorCorrectionLevel: 'M',
      }).catch((err: any) => console.error('QR rendering error:', err));
    }
  }, [issuedPermit]);

  useEffect(() => {
    if (!issuedPermit || !selectedZone) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { generatePermit(selectedZone.id); return 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [issuedPermit, selectedZone, generatePermit]);

  const openBooking = (zone: Zone) => {
    setSelectedZone(zone);
    setIssuedPermit(null);
    setCountdown(30);
    setCurrentStep(1);
  };

  const closeBooking = () => {
    setSelectedZone(null);
    setIssuedPermit(null);
    setCurrentStep(0);
  };

  const toggleSpots = (zoneId: number) => {
    setExpandedSpotsZoneId(prev => prev === zoneId ? null : zoneId);
  };

  const allZones = categories.flatMap(c => c.zones);
  const totalActivePasses = MOCK_ACTIVE_PASSES.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">Loading Ecosystem Data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
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

        {/* Center: Portal Tab */}
        <div>
          <button className="bg-white/15 hover:bg-white/25 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors border border-white/20">
            🌿 Tourist Portal
          </button>
        </div>

        {/* Right: Status + user */}
        <div className="flex items-center gap-2.5">
          <span className="hidden sm:flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ⚠ DEMO
          </span>
          <Wifi className="w-4 h-4 text-blue-300 hidden sm:block" />
          <span className="text-xs font-semibold hidden sm:block">{userName || 'Priya Sharma'}</span>
          <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Tourist</span>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="ml-1 p-1.5 hover:bg-white/15 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4 text-blue-200" />
          </button>
        </div>
      </nav>

      {/* ── Government Header Band ──────────────────────────────────────── */}
      <div className="bg-[#1A237E] text-white px-5 pt-3 pb-5 flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Ashoka circle */}
          <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center text-xl shrink-0 mt-0.5">
            🏛
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider">
                भारत सरकार · GOVERNMENT OF INDIA
              </span>
              <span className="bg-blue-500/40 text-blue-100 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-400/30">
                Official DPI
              </span>
            </div>
            <h1 className="text-xl font-extrabold leading-tight">
              EcoSync Dynamic E-Pass Portal{' '}
              <span className="text-sm font-normal text-blue-200">[ई-पर्मिट पोर्टल]</span>
            </h1>
            <p className="text-[11px] text-blue-200 mt-0.5">
              Ministry of Environment, Forest &amp; Climate Change &amp; Ministry of Tourism
            </p>
          </div>
        </div>

        {/* Right: Citizen badge */}
        <div className="hidden md:flex flex-col items-end gap-1 text-right shrink-0 ml-4">
          <p className="text-[10px] text-blue-300 uppercase font-semibold tracking-wider">Authenticated Citizen</p>
          <p className="text-sm font-bold text-white">{userName || 'Priya Sharma'}</p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-blue-200">Active E-Passes</p>
            <span className="bg-emerald-500 text-white font-extrabold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow">
              {totalActivePasses}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stepper ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-5 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-1">
          {STEPS.map((step, i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${i === currentStep ? 'text-[#1A237E]' : i < currentStep ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                  ${i === currentStep ? 'bg-[#1A237E] text-white' : i < currentStep ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {i < currentStep ? '✓' : i + 1}
                </span>
                <span className="hidden sm:block">{step}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${i < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex gap-5 p-5 max-w-7xl mx-auto">
        {/* Left: Zone Grid */}
        <div className="flex-1 min-w-0">
          {/* Section title */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" />
                Ecological Sensitive Zones (ESZ)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time ecological carrying capacity regulated under State Forest &amp; Wildlife Departments.
              </p>
            </div>
            <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live PostGIS Geofenced Quotas
            </span>
          </div>

          <p className="text-xs text-slate-500 mb-4 -mt-2">
            {allZones.length} zones available for booking &bull;{' '}
            {allZones.filter(z => z.status === 'LOCKDOWN').length} closed
          </p>

          {/* Zone cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allZones.map((zone) => {
              const ratio = zone.current_occupancy / (zone.safe_capacity || 1);
              const sb = statusBadge(zone);
              const hb = hazardBadge(zone);
              const isSpotsExpanded = expandedSpotsZoneId === zone.id;
              const isLocked = zone.status === 'LOCKDOWN';
              const isRestricted = sb.label === 'RESTRICTED';

              return (
                <div
                  key={zone.id}
                  className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all
                    ${isLocked ? 'border-red-200' : isRestricted ? 'border-orange-200' : 'border-slate-200 hover:border-slate-300 hover:shadow-md'}`}
                >
                  <div className="p-4 flex-1">
                    {/* Zone header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-slate-900 truncate">{zone.name}</h3>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-500" />
                          <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">{zone.state}</span>
                        </div>
                      </div>
                      {hb.label !== 'NORMAL' && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ml-2 flex items-center gap-0.5 shrink-0 ${hb.cls}`}>
                          ⚠ {hb.label}
                        </span>
                      )}
                    </div>

                    {/* Weather */}
                    {zone.weather && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-2">
                        <span>{weatherEmoji(zone.weather.condition)}</span>
                        <span className="font-medium">{zone.weather.condition}</span>
                        {zone.weather.temp && <span className="text-slate-400">· {zone.weather.temp}</span>}
                      </div>
                    )}

                    {/* Capacity bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-500">Capacity</span>
                        <span className={`font-bold ${ratio >= 0.85 ? 'text-red-600' : ratio >= 0.7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                          {zone.current_occupancy.toLocaleString()} / {zone.safe_capacity.toLocaleString()} ({Math.round(ratio * 100)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${ratio >= 0.85 ? 'bg-red-500' : ratio >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, ratio * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Status + Hazard badges */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 ${sb.cls}`}>
                        {sb.label === 'OPEN' ? '✓' : sb.label === 'WARNING' ? '⚠' : '⛔'} {sb.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${hb.cls}`}>
                        {hb.label}
                      </span>
                    </div>

                    {/* FASTag */}
                    {zone.gateways.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                        <span>🚗</span>
                        <span className="font-semibold text-slate-600">{zone.gateways.length} FASTag</span>
                        <span>checkpost{zone.gateways.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Tourist Spots accordion */}
                    {zone.spots && zone.spots.length > 0 && (
                      <div className="mt-3 border-t border-slate-100 pt-2.5">
                        <button
                          onClick={() => toggleSpots(zone.id)}
                          className="w-full flex items-center justify-between text-[11px] font-bold text-slate-700 hover:text-indigo-800 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <Compass className="w-3 h-3 text-indigo-500" />
                            Attractions ({zone.spots.length})
                          </span>
                          {isSpotsExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        {isSpotsExpanded && (
                          <div className="mt-2 space-y-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {zone.spots.map((spot) => {
                              const sr = spot.current_crowd / (spot.max_capacity || 1);
                              return (
                                <div key={spot.id} className="text-[11px]">
                                  <div className="flex justify-between mb-0.5">
                                    <span className="font-medium text-slate-700 truncate pr-2">{spot.name}</span>
                                    <span className={`font-mono font-bold ${sr >= 0.85 ? 'text-red-600' : 'text-slate-500'}`}>
                                      {spot.current_crowd}/{spot.max_capacity}
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-1.5 rounded-full ${sr >= 0.85 ? 'bg-red-500' : sr >= 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, sr * 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card footer CTA */}
                  <div className="bg-slate-50 p-3 border-t border-slate-100">
                    {isLocked ? (
                      <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-xl flex items-center gap-1.5">
                        <span>⛔</span> Zone is under Emergency Lockdown
                      </div>
                    ) : isRestricted ? (
                      <div className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded-xl flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-orange-600" />
                        Capacity &gt;85% — Reroute discount eligible. Visit lower-occupancy zones for a 20% discount.
                      </div>
                    ) : (
                      <button
                        onClick={() => openBooking(zone)}
                        className="w-full bg-[#1A237E] hover:bg-[#283593] active:scale-[0.98] text-white font-semibold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
                      >
                        <QrCode className="w-4 h-4" /> Issue Entry Permit
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Sidebar: Active Passes ────────────────────────────── */}
        <div className="w-72 shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-4">
            <div className="bg-[#1A237E] text-white px-4 py-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Your Active Passes</h3>
              <span className="bg-white text-[#1A237E] text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                {totalActivePasses}
              </span>
            </div>

            <div className="p-3 space-y-3">
              {MOCK_ACTIVE_PASSES.map((pass) => (
                <div
                  key={pass.id}
                  className="border border-slate-200 rounded-xl p-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-[#1A237E]">{pass.id}</span>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{pass.zone}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Valid until: {pass.validUntil}</p>
                </div>
              ))}

              <p className="text-[11px] text-slate-400 text-center pt-1 pb-1">
                Click on any pass to render the live rotating QR code for guard checkposts.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── E-Permit Modal ──────────────────────────────────────────────── */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-gray-100 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeBooking}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-2 bg-indigo-50 text-[#1A237E] rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">E-Permit Issuance</h3>
                <p className="text-xs text-gray-500 font-medium">{selectedZone.name} ({selectedZone.state})</p>
              </div>
            </div>

            {!issuedPermit ? (
              <div className="space-y-4 my-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-gray-500" /> Vehicle Registration Number
                  </label>
                  <input
                    type="text"
                    value={vehicleReg}
                    onChange={(e) => setVehicleReg(e.target.value.toUpperCase())}
                    placeholder="e.g. MH 14 DX 1234"
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold tracking-wider text-gray-800 uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Vehicle Category / Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Private SUV">Private SUV</option>
                    <option value="Private Sedan">Private Sedan / Hatchback</option>
                    <option value="Electric Vehicle (EV)">Electric Vehicle (EV)</option>
                    <option value="State / Tourist Coach">Tourist Coach / Bus</option>
                    <option value="Commercial 4x4">Commercial 4x4 / Gypsy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-gray-500" /> Passenger Headcount
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                  <b>Ed25519 Cryptographic Guarantee:</b> Your dynamic QR code rotates every 30 seconds using an offline-verifiable TOTP salt to prevent screenshot cloning.
                </div>

                <button
                  disabled={isGenerating || !vehicleReg}
                  onClick={() => { generatePermit(selectedZone.id); setCurrentStep(2); }}
                  className="w-full bg-[#1A237E] hover:bg-[#283593] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow"
                >
                  {isGenerating ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Signing with Ed25519…</>
                  ) : (
                    <><QrCode className="w-4 h-4" /> Issue &amp; Generate Dynamic QR</>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white border-2 border-indigo-900 rounded-2xl shadow-lg flex flex-col items-center my-3">
                  <canvas ref={canvasRef} className="rounded-lg shadow-sm" />
                  <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-indigo-50 text-[#1A237E] px-3.5 py-1.5 rounded-full border border-indigo-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>Rotating in <b className="text-indigo-700 text-sm font-extrabold">{countdown}s</b></span>
                  </div>
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 mt-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Permit ID:</span>
                    <span className="font-mono font-bold">#{issuedPermit.permit_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span className="font-mono font-bold">{vehicleReg} ({vehicleType})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers:</span>
                    <span className="font-bold">{passengers} Commuters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Security:</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Ed25519 Validated
                    </span>
                  </div>
                </div>

                <div className="w-full mt-3">
                  <p className="text-[10px] text-gray-400 truncate font-mono">
                    Token: {issuedPermit.token.substring(0, 48)}…
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 w-full mt-4">
                  <button
                    onClick={() => generatePermit(selectedZone.id)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Force Refresh
                  </button>
                  <button
                    onClick={closeBooking}
                    className="py-2 px-3 bg-[#1A237E] text-white rounded-xl text-xs font-bold hover:bg-[#283593]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
