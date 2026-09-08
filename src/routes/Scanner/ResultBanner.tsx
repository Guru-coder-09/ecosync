import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import type { VerificationResult } from '../../lib/types';
import { formatISTDateTime } from '../../lib/utils';

// ── Vibration patterns ─────────────────────────────────────────────────────────
const VIBRATE_SUCCESS = [200];
const VIBRATE_FAILURE = [100, 100, 100];
const VIBRATE_DRIFT   = [200, 100, 200];

// ── Failure reason human-readable map ─────────────────────────────────────────
const REASON_LABELS: Record<string, { short: string; detail: string }> = {
  EXPIRED:        { short: 'PERMIT EXPIRED',         detail: 'This QR code has passed its validity window. The permit has expired.' },
  TAMPERED:       { short: 'SIGNATURE INVALID',      detail: 'Cryptographic verification failed. The QR may have been forged or modified.' },
  INVALID_FORMAT: { short: 'INVALID QR FORMAT',      detail: 'The scanned code is not a valid EcoSync permit token.' },
  NO_PUBLIC_KEY:  { short: 'PUBLIC KEY UNAVAILABLE', detail: 'Cannot verify — no cached public key found. Reconnect to sync keys, then retry.' },
  CLOCK_DRIFT:    { short: 'CLOCK OUT OF SYNC',      detail: 'Guard device clock may be out of sync. Verify permit manually.' },
};

function zoneLabel(zid: string): string {
  return `Zone …${zid.slice(-6).toUpperCase()}`;
}

// ── Countdown bar ──────────────────────────────────────────────────────────────
interface CountdownBarProps {
  totalMs: number;
  color: string;
  onComplete: () => void;
}

const CountdownBar: React.FC<CountdownBarProps> = ({ totalMs, color, onComplete }) => {
  const [remaining, setRemaining] = useState(totalMs);
  const startRef = useRef(Date.now());
  const rafRef   = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const left    = Math.max(0, totalMs - elapsed);
      setRemaining(left);
      if (left > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        onComplete();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMs]);

  const pct = (remaining / totalMs) * 100;
  return (
    <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 rounded-b-2xl overflow-hidden">
      <div className={`h-full ${color} transition-none`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ── Detail cell ────────────────────────────────────────────────────────────────
interface DetailCellProps {
  label: string;
  value: string;
  mono?: boolean;
  large?: boolean;
  bgClass?: string;
}

const DetailCell: React.FC<DetailCellProps> = ({ label, value, mono, large, bgClass = 'bg-green-700/60' }) => (
  <div className={`${bgClass} px-4 py-3`}>
    <p className="text-xs font-bold tracking-widest text-green-200 uppercase mb-1">{label}</p>
    <p className={`font-black break-all leading-tight text-white ${large ? 'text-2xl' : 'text-base'} ${mono ? 'font-mono' : ''}`}>
      {value}
    </p>
  </div>
);

// ── Main component ─────────────────────────────────────────────────────────────
interface ResultBannerProps {
  result: VerificationResult | null;
  scanType: 'ENTRY' | 'EXIT';
  onDismiss: () => void;
}

const ResultBanner: React.FC<ResultBannerProps> = ({ result, scanType, onDismiss }) => {
  const vibratedRef = useRef(false);

  const variant: 'success' | 'failure' | 'drift' | null = (() => {
    if (!result) return null;
    if (result.valid)                    return 'success';
    if (result.reason === 'CLOCK_DRIFT') return 'drift';
    return 'failure';
  })();

  useEffect(() => {
    if (!variant || vibratedRef.current) return;
    vibratedRef.current = true;
    if (!navigator.vibrate) return;
    if (variant === 'success') navigator.vibrate(VIBRATE_SUCCESS);
    if (variant === 'failure') navigator.vibrate(VIBRATE_FAILURE);
    if (variant === 'drift')   navigator.vibrate(VIBRATE_DRIFT);
  }, [variant]);

  useEffect(() => { vibratedRef.current = false; }, [result]);

  const handleDismiss = useCallback(() => onDismiss(), [onDismiss]);

  if (!result || !variant) return null;

  /* ── SUCCESS ── */
  if (variant === 'success' && result.payload) {
    const p = result.payload;
    const slotLabel = formatISTDateTime(new Date(p.exp * 1000).toISOString());
    return (
      <div
        role="alert" aria-live="assertive" onClick={handleDismiss}
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer select-none bg-green-600 text-white shadow-2xl border-4 border-green-400 animate-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-center gap-4 px-6 pt-5 pb-3">
          <CheckCircle2 size={48} strokeWidth={2.5} className="shrink-0 text-green-100" />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tracking-widest uppercase leading-tight">PERMIT VERIFIED</p>
            <p className="text-lg font-bold text-green-100 tracking-wider">
              {scanType === 'ENTRY' ? '✅ ACCESS GRANTED — ENTRY' : '✅ ACCESS GRANTED — EXIT'}
            </p>
          </div>
          <button
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="p-3 rounded-full bg-green-500 hover:bg-green-400 active:scale-95 transition-transform"
          >
            <X size={24} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-px bg-green-500 border-t border-green-500 text-center">
          <DetailCell label="VEHICLE NO" value={p.veh} mono large />
          <DetailCell label="ZONE"       value={zoneLabel(p.zid)} />
          <DetailCell label="SLOT (IST)" value={slotLabel} />
          <DetailCell label="PASSENGERS" value={String(p.count)} large />
        </div>
        <CountdownBar totalMs={6000} color="bg-green-300" onComplete={handleDismiss} />
      </div>
    );
  }

  /* ── CLOCK DRIFT ── */
  if (variant === 'drift') {
    return (
      <div
        role="alert" aria-live="assertive" onClick={handleDismiss}
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer select-none bg-amber-400 text-gray-950 shadow-2xl border-4 border-amber-300 animate-in slide-in-from-top-4 duration-300"
      >
        <div className="flex items-start gap-4 px-6 pt-5 pb-5">
          <AlertTriangle size={48} strokeWidth={2.5} className="shrink-0 mt-1 text-amber-900" />
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-black tracking-widest uppercase leading-tight text-gray-950">CLOCK DRIFT / OUT OF BOUNDS</p>
            <p className="mt-2 text-base font-semibold text-gray-800">Guard device clock may be out of sync.</p>
            <p className="mt-1 text-sm font-medium text-gray-700">Verify permit manually using physical permit ID.</p>
          </div>
          <button
            aria-label="Dismiss"
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            className="p-3 rounded-full bg-amber-300 hover:bg-amber-200 active:scale-95 transition-transform text-gray-900"
          >
            <X size={24} />
          </button>
        </div>
      </div>
    );
  }

  /* ── FAILURE ── */
  const reasonInfo = REASON_LABELS[result.reason] ?? { short: result.reason, detail: 'An unknown verification error occurred.' };
  return (
    <div
      role="alert" aria-live="assertive" onClick={handleDismiss}
      className="relative w-full rounded-2xl overflow-hidden cursor-pointer select-none bg-red-700 text-white shadow-2xl border-4 border-red-500 animate-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center gap-4 px-6 pt-5 pb-3">
        <XCircle size={48} strokeWidth={2.5} className="shrink-0 text-red-200" />
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-black tracking-widest uppercase leading-tight">ACCESS DENIED</p>
          <p className="text-lg font-bold text-red-200 tracking-wider uppercase">{reasonInfo.short}</p>
        </div>
        <button
          aria-label="Dismiss"
          onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          className="p-3 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 transition-transform"
        >
          <X size={24} />
        </button>
      </div>
      <div className="px-6 pb-4 pt-1 border-t border-red-600">
        <p className="text-base font-medium text-red-100">{reasonInfo.detail}</p>
        <p className="mt-2 text-sm text-red-300 italic">Do NOT grant access. Escalate if permit holder is present.</p>
      </div>
      <CountdownBar totalMs={8000} color="bg-red-400" onComplete={handleDismiss} />
    </div>
  );
};

export { ResultBanner };
export default ResultBanner;
