import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthRoleStore } from '../stores/authRoleStore';
import { useDestinationStore } from '../stores/destinationStore';
import { api, Zone } from '../lib/api';
import { 
  MapPin, ShieldAlert, ArrowRightCircle, QrCode, RefreshCw, CheckCircle, 
  ShieldCheck, Car, Users, X, CloudRain, Wind, Droplets, AlertTriangle, 
  Compass, ChevronDown, ChevronUp, LogOut
} from 'lucide-react';
import QRCode from 'qrcode';

export const TouristPortal = () => {
  const navigate = useNavigate();
  const { userName, logout } = useAuthRoleStore();
  const { categories, fetchData, loading } = useDestinationStore();
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [expandedSpotsZoneId, setExpandedSpotsZoneId] = useState<number | null>(1); // default expand first zone

  // Booking form state
  const [vehicleReg, setVehicleReg] = useState('MH 14 DX 4022');
  const [passengers, setPassengers] = useState(2);
  const [vehicleType, setVehicleType] = useState('Private SUV');
  const [issuedPermit, setIssuedPermit] = useState<{ permit_id: number; token: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        width: 220,
        margin: 2,
        color: {
          dark: '#1A237E',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      }).catch((err: any) => console.error('QR rendering error:', err));
    }
  }, [issuedPermit]);

  useEffect(() => {
    if (!issuedPermit || !selectedZone) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generatePermit(selectedZone.id);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [issuedPermit, selectedZone, generatePermit]);

  const openBooking = (zone: Zone) => {
    setSelectedZone(zone);
    setIssuedPermit(null);
    setCountdown(30);
  };

  const closeBooking = () => {
    setSelectedZone(null);
    setIssuedPermit(null);
  };

  const toggleSpots = (zoneId: number) => {
    setExpandedSpotsZoneId(prev => prev === zoneId ? null : zoneId);
  };

  if (loading) return <div className="p-10 text-center text-gray-500 font-medium">Loading Ecosystem Data...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-16">
      {/* DPI Header */}
      <header className="bg-[#1A237E] text-white p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FF6F00] flex items-center justify-center font-bold text-white shadow text-sm">In</div>
          <div>
            <h1 className="text-xl font-bold tracking-wide leading-tight">EcoSync <span className="text-emerald-400 font-normal">DPI Prototype</span></h1>
            <p className="text-[10px] text-gray-300">National Ecological Carrying Capacity Architecture</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{userName || 'Citizen Tourist'}</p>
            <p className="text-[10px] text-gray-300">Public Traveler Session</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Switch Role
          </button>
        </div>
      </header>

      {/* Top Bar Counters */}
      <div className="bg-white shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-200">
        {categories.map((cat) => {
          const ratio = cat.total_occupancy / (cat.total_capacity || 1);
          return (
            <div key={cat.id} className="border rounded-xl p-3.5 flex flex-col bg-slate-50/70 border-slate-200">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{cat.name} Load</span>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {cat.total_occupancy.toLocaleString()} <span className="text-sm font-normal text-gray-400">/ {cat.total_capacity.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2.5 overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${ratio > 0.85 ? 'bg-red-500' : 'bg-[#00695C]'}`} 
                  style={{ width: `${Math.min(100, ratio * 100)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Selector */}
      <main className="p-6 max-w-7xl mx-auto space-y-10">
        {categories.map((cat) => (
          <section key={cat.id}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="text-[#00695C] w-5 h-5" /> {cat.name}
              </h2>
              <span className="text-xs text-gray-500 font-medium">{cat.zones.length} Protected Zones Monitored</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cat.zones.map((zone) => {
                const isHighOccupancy = zone.current_occupancy >= zone.safe_capacity * 0.85;
                const isYield = zone.status === 'YIELD_REROUTE' || isHighOccupancy;
                const ratio = zone.current_occupancy / (zone.safe_capacity || 1);
                const isSpotsExpanded = expandedSpotsZoneId === zone.id;

                return (
                  <div key={zone.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col justify-between transition-all ${isYield ? 'border-orange-300' : 'border-slate-200 hover:border-slate-300'}`}>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">{zone.name}</h3>
                          <p className="text-xs text-gray-500 font-medium">{zone.state}</p>
                        </div>
                        {isYield && (
                          <span className="bg-orange-100 text-orange-800 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shadow-xs">
                            <ArrowRightCircle className="w-3.5 h-3.5 text-orange-600" /> Yield Reroute
                          </span>
                        )}
                      </div>

                      {/* Live Weather & Advisory Badge */}
                      {zone.weather && (
                        <div className="my-3 bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-xs text-slate-700">
                          <div className="flex items-center justify-between font-semibold">
                            <div className="flex items-center gap-1.5 text-blue-900">
                              <CloudRain className="w-4 h-4 text-blue-600" />
                              <span>{zone.weather.temp}</span> • <span>{zone.weather.condition}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                              <span className="flex items-center gap-0.5"><Droplets className="w-3 h-3" /> {zone.weather.humidity}</span>
                              <span className="flex items-center gap-0.5"><Wind className="w-3 h-3" /> {zone.weather.wind}</span>
                            </div>
                          </div>
                          {zone.weather.alert && (
                            <div className="mt-1.5 pt-1.5 border-t border-blue-100/80 flex items-center gap-1 text-[11px] font-semibold text-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>{zone.weather.alert}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Carrying Capacity Gauge */}
                      <div className="mt-4 mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">Headcount vs Safe Capacity</span>
                          <span className="font-bold text-gray-900">{(ratio * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${isHighOccupancy ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-right mt-1 text-gray-500 font-medium">{zone.current_occupancy.toLocaleString()} / {zone.safe_capacity.toLocaleString()} max</p>
                      </div>

                      {/* FASTag Checkpost Badges */}
                      <div className="mt-3 text-xs flex flex-wrap gap-1.5">
                        {zone.gateways.map((g) => (
                          <span key={g.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-medium text-[11px]">
                            {g.gateway_type === 'FASTAG_TOLL' ? '🚗 RFID Node' : '🛂 Checkpost'}: {g.name}
                          </span>
                        ))}
                      </div>

                      {/* Specific Tourist Spots Micro-Capacity Section */}
                      {zone.spots && zone.spots.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-3">
                          <button 
                            onClick={() => toggleSpots(zone.id)}
                            className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-indigo-900 transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-indigo-600" />
                              Attractions &amp; Micro-Capacity ({zone.spots.length})
                            </span>
                            {isSpotsExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                          </button>

                          {isSpotsExpanded && (
                            <div className="mt-2.5 space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 animate-in fade-in duration-150">
                              {zone.spots.map((spot) => {
                                const spotRatio = spot.current_crowd / (spot.max_capacity || 1);
                                const isSpotHigh = spotRatio >= 0.85;
                                return (
                                  <div key={spot.id} className="text-xs">
                                    <div className="flex justify-between items-center mb-0.5">
                                      <span className="font-semibold text-slate-800 truncate pr-2">{spot.name}</span>
                                      <span className={`font-mono text-[11px] font-bold ${isSpotHigh ? 'text-red-600' : 'text-slate-600'}`}>
                                        {spot.current_crowd}/{spot.max_capacity}
                                      </span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className={`h-1.5 rounded-full ${isSpotHigh ? 'bg-red-500' : spotRatio > 0.6 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                        style={{ width: `${Math.min(100, spotRatio * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 p-4 border-t border-slate-100">
                      {isYield ? (
                        <div className="text-xs text-orange-800 bg-orange-50 border border-orange-200 p-2.5 rounded-xl flex items-start gap-2">
                          <ShieldAlert className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Capacity &gt;85%:</span> Reroute discount eligible. Visit lower-occupancy spots for a <b>20% carrying-capacity discount</b>.
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => openBooking(zone)}
                          className="w-full bg-[#1A237E] hover:bg-[#283593] active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <QrCode className="w-4 h-4" /> Issue Entry Permit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Live Dynamic QR Booking Modal */}
      {selectedZone && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
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
                  onClick={() => generatePermit(selectedZone.id)}
                  className="w-full bg-[#1A237E] hover:bg-[#283593] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Signing with Ed25519...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Issue &amp; Generate Dynamic QR
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-4 bg-white border-2 border-indigo-900 rounded-2xl shadow-lg flex flex-col items-center my-3 relative">
                  <canvas ref={canvasRef} className="rounded-lg shadow-sm" />

                  <div className="mt-3 flex items-center gap-2 text-xs font-bold bg-indigo-50 text-[#1A237E] px-3.5 py-1.5 rounded-full border border-indigo-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
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
                    Token: {issuedPermit.token.substring(0, 48)}...
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
