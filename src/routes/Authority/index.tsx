import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ShieldAlert, Clock } from 'lucide-react';
import { useZoneStore } from '../../stores/zoneStore';
import { useScanStore } from '../../stores/scanStore';
import { useAuthStore } from '../../stores/authStore';
import { ZoneMap } from '../../components/ZoneMap';
import { HazardModal } from '../../components/HazardModal';
import { StatCards } from './StatCards';
import { ZoneControlPanel } from './ZoneControlPanel';
import { ScanFeed } from './ScanFeed';
import { formatISTDateTime } from '../../lib/utils';
import type { Zone } from '../../lib/types';

type ModalMode = 'lockdown' | 'lift';

// ---------------------------------------------------------------------------
// Real-time IST clock hook
// ---------------------------------------------------------------------------
function useISTClock(): string {
  const [display, setDisplay] = useState(() => formatISTDateTime(new Date().toISOString()));

  useEffect(() => {
    const id = setInterval(() => {
      setDisplay(formatISTDateTime(new Date().toISOString()));
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  return display;
}

// ---------------------------------------------------------------------------
// Authority Dashboard
// ---------------------------------------------------------------------------
export default function AuthorityDashboard() {
  const { zones, loading: zonesLoading, fetchZones, updateZone, subscribeToZones } = useZoneStore();
  const { recentScans, fetchRecentScans, subscribeToScans } = useScanStore();
  const { user } = useAuthStore();

  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [modalZone, setModalZone] = useState<Zone | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);

  const clock = useISTClock();

  // Subscription teardown refs
  const unsubZonesRef = useRef<(() => void) | null>(null);
  const unsubScansRef = useRef<(() => void) | null>(null);

  // Mount: fetch + subscribe
  useEffect(() => {
    fetchZones();
    fetchRecentScans();

    unsubZonesRef.current = subscribeToZones();
    unsubScansRef.current = subscribeToScans();

    return () => {
      unsubZonesRef.current?.();
      unsubScansRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Modal handlers ----
  const handleLockdown = useCallback((zone: Zone) => {
    setModalZone(zone);
    setModalMode('lockdown');
  }, []);

  const handleLiftLockdown = useCallback((zone: Zone) => {
    setModalZone(zone);
    setModalMode('lift');
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalZone(null);
    setModalMode(null);
  }, []);

  // ---- Capacity update ----
  const handleUpdateCapacity = useCallback(
    (id: string, capacity: number) => {
      updateZone(id, { safe_capacity: capacity });
    },
    [updateZone],
  );

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* ================================================================
          HEADER — NDMA / GoI Authority style
          ================================================================ */}
      <header
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1A237E 0%, #B71C1C 55%, #1A237E 100%)',
        }}
      >
        {/* Decorative diagonal stripe */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
            backgroundSize: '12px 12px',
          }}
        />

        <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Left: Emblem + identity */}
          <div className="flex items-center gap-4">
            {/* Ashoka Chakra placeholder */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center">
              <ShieldAlert size={30} className="text-white" strokeWidth={1.5} />
            </div>

            <div>
              {/* Satyamev Jayate in Devanagari */}
              <p className="text-white/70 text-[11px] font-medium tracking-[0.25em] uppercase">
                सत्यमेव जयते
              </p>
              <h1 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                EcoSync Authority
              </h1>
              <p className="text-white/80 text-xs font-medium mt-0.5 tracking-wide">
                National Disaster Management Authority &nbsp;·&nbsp; GoI DPI Ecological Permit System
              </p>
            </div>
          </div>

          {/* Right: Real-time IST clock + user */}
          <div className="flex flex-col items-start sm:items-end gap-1.5">
            <div className="flex items-center gap-2 bg-white/10 rounded px-3 py-1.5 border border-white/20">
              <Clock size={13} className="text-white/70" />
              <span className="text-white font-mono text-sm tracking-wider">{clock}</span>
            </div>
            {user && (
              <p className="text-white/60 text-xs">
                Logged in as{' '}
                <span className="font-semibold text-white/80">{user.email ?? user.id}</span>
              </p>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-widest border border-white/30">
              Authority Access
            </span>
          </div>
        </div>
      </header>

      {/* ================================================================
          DISCLAIMER BANNER
          ================================================================ */}
      <div className="bg-[#1A237E] border-b border-indigo-900">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-2">
          <span className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest shrink-0">
            ⚖ Legal Notice:
          </span>
          <p className="text-indigo-200 text-[10px] leading-tight">
            This system is authorised under the{' '}
            <strong className="text-white">Environment Protection Act, 1986</strong> and the{' '}
            <strong className="text-white">Disaster Management Act, 2005</strong>. Unauthorised
            access is a punishable offence. All actions are logged and audited.
          </p>
        </div>
      </div>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Loading skeleton */}
        {zonesLoading && zones.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-[#1A237E]"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-sm text-gray-500">Loading zone data…</p>
            </div>
          </div>
        )}

        {/* Stat cards row */}
        {zones.length > 0 && <StatCards zones={zones} />}

        {/* Two-column layout */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* LEFT — 60%: Zone Control Panel */}
          <div className="xl:w-[60%] flex flex-col gap-6">
            <ZoneControlPanel
              zones={zones}
              onLockdown={handleLockdown}
              onLiftLockdown={handleLiftLockdown}
              onUpdateCapacity={handleUpdateCapacity}
            />
          </div>

          {/* RIGHT — 40%: Map + Scan Feed stacked */}
          <div className="xl:w-[40%] flex flex-col gap-6">
            {/* Zone Map */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-[#1A237E] uppercase tracking-wider">
                  Zone Map
                </h3>
              </div>
              <div className="h-[340px]">
                <ZoneMap
                  zones={zones}
                  selectedZone={selectedZone}
                  onZoneSelect={setSelectedZone}
                />
              </div>
            </div>

            {/* Scan Feed */}
            <ScanFeed scans={recentScans} zones={zones} />
          </div>
        </div>
      </main>

      {/* ================================================================
          HAZARD MODAL OVERLAY
          ================================================================ */}
      {modalZone && modalMode && (
        <HazardModal zone={modalZone} onClose={handleCloseModal} mode={modalMode} />
      )}
    </div>
  );
}
