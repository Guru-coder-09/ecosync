import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Car,
  Calendar,
  ShieldCheck,
  Ticket,
  ChevronRight,
  Sparkles,
  Info,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { ZoneSelector } from './ZoneSelector';
import { BookingForm } from './BookingForm';
import { EPassView } from './EPassView';
import { YieldBanner } from './YieldBanner';
import { useZoneStore } from '../../stores/zoneStore';
import { usePermitStore } from '../../stores/permitStore';
import { useAuthStore } from '../../stores/authStore';
import { SignInForm } from '../../components/AuthGuard';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { capacityPct, formatISTDateTime, permitStatusBadgeClass } from '../../lib/utils';
import type { Zone, Permit, BookingFormData } from '../../lib/types';

export default function TouristPortal() {
  const { user, profile } = useAuthStore();
  const { zones, loading: zonesLoading, fetchZones, subscribeToZones } = useZoneStore();
  const {
    permits,
    loading: permitsLoading,
    fetchMyPermits,
    createPermit,
    activePermit,
    setActivePermit,
  } = usePermitStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize and subscribe
  useEffect(() => {
    fetchZones();
    const unsub = subscribeToZones();
    return () => unsub();
  }, [fetchZones, subscribeToZones]);

  useEffect(() => {
    if (user?.id) {
      fetchMyPermits(user.id);
    }
  }, [user?.id, fetchMyPermits]);

  // If user clicks on an existing permit from active list
  const handleSelectPermit = (p: Permit) => {
    setActivePermit(p);
    setStep(4);
  };

  // Step 1: User picks a zone
  const handleZoneSelect = (zone: Zone) => {
    setSelectedZone(zone);
    setDiscountApplied(false);
    setStep(2);
  };

  // Reroute switch from Yield Banner (20% discount)
  const handleSelectAlternative = (altZone: Zone) => {
    setSelectedZone(altZone);
    setDiscountApplied(true);
    setStep(2);
  };

  // Step 2 & 3: Submit booking
  const handleBookingSubmit = async (formData: BookingFormData) => {
    if (!user) return;
    setBookingLoading(true);
    setErrorMsg(null);
    try {
      const discount = discountApplied
        ? { applied: true, percent: 20 }
        : { applied: false, percent: 0 };
      const newPermit = await createPermit(user.id, formData, discount);
      setActivePermit(newPermit);
      setStep(4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate permit. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleStartNewBooking = () => {
    setActivePermit(null);
    setSelectedZone(null);
    setDiscountApplied(false);
    setStep(1);
  };

  // Filter user's active permits
  const activePermitsList = useMemo(() => {
    return permits.filter((p) => p.status === 'ACTIVE');
  }, [permits]);

  if (!user) {
    return <SignInForm />;
  }

  const selectedPct = selectedZone
    ? capacityPct(selectedZone.current_occupancy, selectedZone.safe_capacity)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Tricolor Header Stripe */}
      <div className="goi-stripe" />

      {/* Top Ministry Banner */}
      <header className="bg-navy-900 text-white shadow-md border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-serif text-saffron-400 select-none">
              ☸
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-saffron-400 font-semibold font-hindi">
                  भारत सरकार · Government of India
                </span>
                <span className="text-[10px] bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 rounded-full font-medium">
                  Official DPI
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                EcoSync Dynamic E-Pass Portal
                <span className="text-xs font-normal text-slate-300 font-hindi">
                  (ई-परमिट पोर्टल)
                </span>
              </h1>
              <p className="text-xs text-slate-300">
                Ministry of Environment, Forest and Climate Change & Ministry of Tourism
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs">
            <div>
              <p className="text-slate-400">Authenticated Citizen</p>
              <p className="font-semibold text-white truncate max-w-[180px]">
                {profile?.full_name || user.email}
              </p>
            </div>
            <div className="h-6 w-px bg-white/20" />
            <div className="text-right">
              <p className="text-slate-400">Active E-Passes</p>
              <p className="font-bold text-saffron-400 text-sm">
                {activePermitsList.length}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Wizard Bar (Steps 1-4) */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <nav aria-label="Progress">
            <ol className="flex items-center gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
              {[
                { s: 1, label: 'Select Zone', hindi: 'क्षेत्र चयन' },
                { s: 2, label: 'Vehicle & Time Slot', hindi: 'वाहन एवं समय' },
                { s: 3, label: 'Eco-Verification', hindi: 'पर्यावरण सत्यापन' },
                { s: 4, label: 'Digital E-Pass', hindi: 'डिजिटल ई-पास' },
              ].map((item, idx) => {
                const isCurrent = step === item.s;
                const isPast = step > item.s;
                return (
                  <li key={item.s} className="flex items-center gap-2">
                    {idx > 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
                    <div
                      className={`flex items-center gap-1.5 ${
                        isCurrent
                          ? 'text-navy-900 font-bold'
                          : isPast
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          isCurrent
                            ? 'bg-navy-900 text-white shadow-sm'
                            : isPast
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isPast ? '✓' : item.s}
                      </span>
                      <span className="hidden md:inline">{item.label}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Wizard Steps */}
        <main className={`space-y-6 ${activePermitsList.length > 0 && step !== 4 ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <Info className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SELECT ZONE */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-saffron-900" />
                    Ecological Sensitive Zones (ESZ)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Real-time ecological carrying capacity regulated under State Forest & Wildlife Departments.
                  </p>
                </div>
                <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5 self-start sm:self-auto">
                  <ShieldCheck className="w-4 h-4" />
                  Live PostGIS Geofenced Quotas
                </div>
              </div>

              {zonesLoading ? (
                <div className="py-16 flex justify-center">
                  <LoadingSpinner label="Loading monitored ecological zones..." />
                </div>
              ) : (
                <ZoneSelector
                  zones={zones}
                  onSelect={handleZoneSelect}
                  selectedId={selectedZone?.id ?? null}
                />
              )}
            </div>
          )}

          {/* STEP 2: BOOKING DETAILS */}
          {step === 2 && selectedZone && (
            <div className="space-y-6">
              {/* Yield Reroute Banner if zone capacity >= 85% */}
              {selectedPct >= 85 && (
                <YieldBanner
                  selectedZone={selectedZone}
                  alternativeZones={zones}
                  onSelectAlternative={handleSelectAlternative}
                  discount={20}
                />
              )}

              {discountApplied && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                    <span>
                      <strong>Municipal Green Discount Applied:</strong> 20% waiver on FASTag ecological toll for selecting an alternative zone.
                    </span>
                  </div>
                  <span className="bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded text-[11px]">
                    20% OFF
                  </span>
                </div>
              )}

              <BookingForm
                zone={selectedZone}
                onSubmit={handleBookingSubmit}
                onBack={() => setStep(1)}
                loading={bookingLoading}
                applyDiscount={discountApplied}
              />
            </div>
          )}

          {/* STEP 4: ACTIVE E-PASS DISPLAY */}
          {step === 4 && activePermit && (
            <div className="max-w-2xl mx-auto">
              <EPassView
                permit={activePermit}
                onNewBooking={handleStartNewBooking}
              />
            </div>
          )}
        </main>

        {/* Right Sidebar: My Active Permits (Shown during Steps 1-3) */}
        {activePermitsList.length > 0 && step !== 4 && (
          <aside className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-navy-900" />
                  <h3 className="font-bold text-sm text-navy-900">Your Active Passes</h3>
                </div>
                <span className="text-xs bg-navy-50 text-navy-700 font-bold px-2 py-0.5 rounded-full">
                  {activePermitsList.length}
                </span>
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {activePermitsList.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectPermit(p)}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-navy-50/60 hover:border-navy-200 transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-navy-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {p.vehicle_reg_number}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${permitStatusBadgeClass(p.status)}`}>
                        {p.status}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-navy-900">
                      {p.zones?.name || 'Ecological Zone'}
                    </p>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Valid until:</span>
                      <span className="font-medium text-slate-700">
                        {formatISTDateTime(p.slot_end)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Click on any pass to render the live rotating QR code for guard checkposts.
              </p>
            </div>
          </aside>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-100 border-t border-slate-200 py-6 text-center text-xs text-slate-500 space-y-1">
        <p>National Ecological Carrying Capacity DPI (EcoSync) · National Informatics Centre (NIC) / NDMA</p>
        <p className="text-[10px] text-slate-400">
          Compliant with ISO-8601 UTC Timestamps and IST (UTC+05:30) Standards.
        </p>
      </footer>
    </div>
  );
}
