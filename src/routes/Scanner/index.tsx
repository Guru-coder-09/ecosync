import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  WifiOff,
  Wifi,
  ArrowDownCircle,
  ArrowUpCircle,
  MapPin,
  UserCheck,
  Radio,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { QRScanner } from './QRScanner';
import { ResultBanner } from './ResultBanner';
import { OfflineQueue } from './OfflineQueue';
import { verifyPermitToken, prefetchPublicKey } from '../../crypto/permitCrypto';
import { useScanStore } from '../../stores/scanStore';
import { useAuthStore } from '../../stores/authStore';
import { useZoneStore } from '../../stores/zoneStore';
import { MOCK_ZONES } from '../../lib/mockData';
import { IS_DEMO_MODE } from '../../lib/env';
import { formatISTDateTime } from '../../lib/utils';
import type { VerificationResult, ScanType } from '../../lib/types';

export default function ScannerPWA() {
  const { user, profile } = useAuthStore();
  const {
    isOffline,
    pendingCount,
    setOffline,
    addScanEntry,
    syncOfflineScans,
    loadPendingCount,
    guardZoneId,
    setGuardZoneId,
  } = useScanStore();

  const { zones, fetchZones } = useZoneStore();

  const [scanType, setScanType] = useState<ScanType>('ENTRY');
  const [verifyResult, setVerifyResult] = useState<VerificationResult | null>(null);
  const [scannerActive, setScannerActive] = useState<boolean>(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>(
    guardZoneId || (zones[0]?.id ?? MOCK_ZONES[1].id)
  );

  // Available zones for checkpost selection
  const availableZones = useMemo(() => {
    return zones.length > 0 ? zones : MOCK_ZONES;
  }, [zones]);

  const currentZone = useMemo(() => {
    return availableZones.find((z) => z.id === selectedZoneId) || availableZones[0];
  }, [availableZones, selectedZoneId]);

  // Pre-fetch public key on boot + load initial queue state
  useEffect(() => {
    prefetchPublicKey();
    loadPendingCount();
    fetchZones();
  }, [loadPendingCount, fetchZones]);

  useEffect(() => {
    if (selectedZoneId) {
      setGuardZoneId(selectedZoneId);
    }
  }, [selectedZoneId, setGuardZoneId]);

  // Handle scanned QR payload from optical sensor or bypass
  const handleScan = useCallback(
    async (rawText: string) => {
      // Temporarily pause scanner during inspection
      setScannerActive(false);

      try {
        const result = await verifyPermitToken(rawText);
        setVerifyResult(result);

        const guardId = user?.id || 'guard-demo-01';

        if (result.valid && result.payload) {
          // Log verified scan
          await addScanEntry({
            permit_id: result.payload.pid,
            guard_id: guardId,
            zone_id: result.payload.zid || selectedZoneId,
            scan_type: scanType,
            verified: true,
            client_salt: result.payload.salt,
          });
        } else {
          // Log tamper/expired/drift attempt for security audit
          await addScanEntry({
            permit_id: result.payload?.pid || 'UNKNOWN_OR_CORRUPT',
            guard_id: guardId,
            zone_id: selectedZoneId,
            scan_type: scanType,
            verified: false,
            failure_reason: result.reason,
            client_salt: result.payload?.salt,
          });
        }
      } catch (err) {
        console.error('Unexpected scanner error:', err);
        setVerifyResult({ valid: false, reason: 'INVALID_FORMAT' });
      }
    },
    [user?.id, selectedZoneId, scanType, addScanEntry]
  );

  const handleDismissBanner = useCallback(() => {
    setVerifyResult(null);
    setScannerActive(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between select-none">
      {/* ── HIGH VISIBILITY TOP BAR (SUNLIGHT READABLE) ────────────────────── */}
      <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-navy-800 border border-navy-600 flex items-center justify-center text-saffron-400 font-bold text-sm shadow">
              GOI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-wider uppercase text-white">
                  EcoSync Checkpost Guard
                </h1>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/50 px-1.5 rounded font-mono font-bold">
                  PWA v1.0
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <UserCheck className="w-3 h-3 text-emerald-400" />
                  {profile?.full_name || 'Officer On Duty'}
                </span>
                {profile?.badge_number && (
                  <span className="font-mono text-gray-400">({profile.badge_number})</span>
                )}
              </div>
            </div>
          </div>

          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 bg-gray-950 border border-gray-700 rounded-xl px-2.5 py-1 text-xs">
            <MapPin className="w-3.5 h-3.5 text-saffron-400 flex-shrink-0" />
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="bg-transparent text-white font-medium text-xs outline-none cursor-pointer max-w-[140px] sm:max-w-[200px] truncate"
            >
              {availableZones.map((z) => (
                <option key={z.id} value={z.id} className="bg-gray-900 text-white">
                  {z.name} ({z.state})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Prominent Offline Mode Alert Banner */}
        {isOffline && (
          <div className="mt-2 py-1 px-3 bg-red-900/80 border border-red-500 rounded-lg flex items-center justify-between text-xs text-red-200">
            <div className="flex items-center gap-2 font-bold">
              <WifiOff className="w-4 h-4 animate-pulse text-red-400" />
              <span>OFFLINE MODE ACTIVE · 0 BARS MOUNTAIN PROTOCOL</span>
            </div>
            <span className="text-[11px] bg-red-950 border border-red-700 px-2 py-0.5 rounded font-mono">
              Local Ed25519 Math
            </span>
          </div>
        )}
      </header>

      {/* ── MAIN INTERACTIVE SCANNER VIEWPORT ──────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 flex flex-col gap-4 relative">
        {/* Entry / Exit Mode Switcher (Large outdoor tactile buttons) */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScanType('ENTRY')}
            className={`py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider transition-all border-2 ${
              scanType === 'ENTRY'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-950'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}
          >
            <ArrowDownCircle className="w-5 h-5" />
            Gate Entry
          </button>

          <button
            type="button"
            onClick={() => setScanType('EXIT')}
            className={`py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 font-black text-sm uppercase tracking-wider transition-all border-2 ${
              scanType === 'EXIT'
                ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-950'
                : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
            }`}
          >
            <ArrowUpCircle className="w-5 h-5" />
            Gate Exit
          </button>
        </div>

        {/* Optical Camera Viewport */}
        <div className="relative flex-1 min-h-[360px] sm:min-h-[440px] rounded-2xl overflow-hidden border-2 border-gray-800 shadow-2xl">
          <QRScanner
            active={scannerActive && !verifyResult}
            onScan={handleScan}
          />

          {/* Full Screen Tactile Result Overlay */}
          {verifyResult && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-3 scanner-result-overlay">
              <ResultBanner
                result={verifyResult}
                scanType={scanType}
                onDismiss={handleDismissBanner}
              />
            </div>
          )}
        </div>

        {/* Live Station Security Protocol */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>
              Station:{' '}
              <strong className="text-slate-200">{currentZone.name}</strong> ·{' '}
              Safe Cap: {currentZone.safe_capacity}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px] text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            IST Window: ±30s
          </div>
        </div>
      </main>

      {/* ── OFFLINE QUEUE & SYNC DOCK ────────────────────────────────────────── */}
      <footer className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="max-w-4xl mx-auto">
          <OfflineQueue
            pendingCount={pendingCount}
            isOffline={isOffline}
            onSync={syncOfflineScans}
            onToggleOffline={(val: boolean) => setOffline(val)}
          />
        </div>
      </footer>
    </div>
  );
}
