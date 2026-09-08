import React, { useState, useCallback } from 'react';
import {
  WifiOff, Wifi, RefreshCw, Database, CloudOff, CloudUpload,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface SyncResult {
  synced: number;
  failed: number;
}

interface OfflineQueueProps {
  pendingCount: number;
  isOffline: boolean;
  onSync: () => Promise<SyncResult>;
  onToggleOffline: (v: boolean) => void;
}

// ── Toast helper ───────────────────────────────────────────────────────────────
interface Toast {
  id: number;
  message: string;
  variant: 'success' | 'error' | 'info';
}

let toastCounter = 0;

// ── Main component ─────────────────────────────────────────────────────────────
const OfflineQueue: React.FC<OfflineQueueProps> = ({
  pendingCount,
  isOffline,
  onSync,
  onToggleOffline,
}) => {
  const [syncing, setSyncing]   = useState(false);
  const [toasts,  setToasts]    = useState<Toast[]>([]);

  const pushToast = useCallback((message: string, variant: Toast['variant']) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const handleSync = useCallback(async () => {
    if (syncing || isOffline) return;
    setSyncing(true);
    try {
      const result = await onSync();
      if (result.failed === 0) {
        pushToast(`✅ Synced ${result.synced} scan(s) successfully.`, 'success');
      } else {
        pushToast(
          `⚠️ Synced ${result.synced}, failed ${result.failed}. Retrying later.`,
          'error',
        );
      }
    } catch {
      pushToast('❌ Sync failed. Check connectivity.', 'error');
    } finally {
      setSyncing(false);
    }
  }, [syncing, isOffline, onSync, pushToast]);

  const TOAST_COLORS: Record<Toast['variant'], string> = {
    success: 'bg-green-700 border-green-500 text-white',
    error:   'bg-red-800  border-red-600   text-white',
    info:    'bg-gray-700 border-gray-500  text-white',
  };

  return (
    <div className="w-full bg-gray-900 border-t border-gray-700 px-4 py-3 space-y-3">

      {/* ── OFFLINE BADGE ── */}
      {isOffline && (
        <div
          role="status"
          aria-label="Offline mode active"
          className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-xl bg-red-700 border-2 border-red-500 text-white font-black text-base tracking-widest uppercase animate-pulse"
        >
          <CloudOff size={20} />
          OFFLINE MODE — SCANS QUEUED LOCALLY
        </div>
      )}

      {/* ── CONTROLS ROW ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Pending count badge */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Database size={20} className={pendingCount > 0 ? 'text-amber-400' : 'text-gray-500'} />
          <span className="text-sm font-bold text-gray-300">Pending:</span>
          <span
            className={`
              inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full text-sm font-black
              ${pendingCount > 0
                ? 'bg-amber-500 text-gray-950 animate-pulse'
                : 'bg-gray-700 text-gray-400'
              }
            `}
          >
            {pendingCount}
          </span>
        </div>

        {/* Sync Now button */}
        <button
          onClick={handleSync}
          disabled={syncing || isOffline || pendingCount === 0}
          aria-label="Sync pending scans to server"
          className="
            flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm
            bg-blue-600 hover:bg-blue-500 active:scale-95 text-white
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all min-h-[44px]
          "
        >
          {syncing
            ? <RefreshCw size={16} className="animate-spin" />
            : <CloudUpload size={16} />
          }
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>

        {/* Simulate 0 Bars toggle */}
        <label
          className="flex items-center gap-2 cursor-pointer select-none"
          aria-label="Simulate offline mode"
        >
          <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
            {isOffline
              ? <span className="flex items-center gap-1 text-red-400"><WifiOff size={14}/> 0 Bars</span>
              : <span className="flex items-center gap-1 text-green-400"><Wifi    size={14}/> Online</span>
            }
          </span>
          {/* Toggle switch */}
          <button
            role="switch"
            aria-checked={isOffline}
            onClick={() => onToggleOffline(!isOffline)}
            className={`
              relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out
              focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
              ${isOffline ? 'bg-red-600 border-red-500' : 'bg-gray-600 border-gray-500'}
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out mt-0.5
                ${isOffline ? 'translate-x-5' : 'translate-x-0.5'}
              `}
            />
          </button>
        </label>
      </div>

      {/* ── PENDING ENTRIES INFO ── */}
      {pendingCount > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-900/40 border border-amber-700/50">
          <Database size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-amber-300">
            <strong className="text-amber-200">{pendingCount} scan(s)</strong> queued in IndexedDB.
            {' '}Scans sync automatically when connectivity is restored.
          </p>
        </div>
      )}

      {/* ── INFO TEXT ── */}
      {pendingCount === 0 && (
        <p className="text-xs text-gray-500 text-center">
          Scans are queued in IndexedDB and sync automatically when connectivity is restored.
        </p>
      )}

      {/* ── TOASTS ── */}
      <div className="fixed bottom-24 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`
              w-full max-w-sm mx-auto px-4 py-3 rounded-xl border-2 text-sm font-bold shadow-2xl pointer-events-auto
              animate-in slide-in-from-bottom-4 duration-300
              ${TOAST_COLORS[t.variant]}
            `}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export { OfflineQueue };
export default OfflineQueue;
