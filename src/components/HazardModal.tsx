// src/components/HazardModal.tsx
// Emergency Hazard Kill Switch modal for the Authority dashboard.
// Requires typing "CONFIRM" before the lockdown is applied.

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, Lock, ShieldAlert, Radio } from "lucide-react";
import type { Zone } from "../lib/types";
import { useZoneStore } from "../stores/zoneStore";
import { cn } from "../lib/utils";

interface HazardModalProps {
  zone: Zone;
  onClose: () => void;
  mode: "lockdown" | "lift";
}

export function HazardModal({ zone, onClose, mode }: HazardModalProps) {
  const { lockdownZone, liftLockdown } = useZoneStore();
  const [confirmText, setConfirmText] = useState("");
  const [executing, setExecuting] = useState(false);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const CONFIRM_WORD = "CONFIRM";
  const isLockdown = mode === "lockdown";
  const isReady = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  // Autofocus on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAction = async () => {
    if (!isReady || executing) return;
    setExecuting(true);
    try {
      if (isLockdown) {
        await lockdownZone(zone.id);
      } else {
        await liftLockdown(zone.id);
      }
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      console.error(err);
      setExecuting(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hazard-modal-title"
    >
      <div
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-slide-up",
          isLockdown ? "border-4 border-red-600" : "border-4 border-emerald-600"
        )}
      >
        {/* Header */}
        <div className={cn("px-6 py-4", isLockdown ? "bg-red-700" : "bg-emerald-700")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isLockdown ? (
                <ShieldAlert className="w-7 h-7 text-white" />
              ) : (
                <Lock className="w-7 h-7 text-white" />
              )}
              <div>
                <p className="text-[10px] text-white/70 uppercase tracking-widest font-semibold">
                  {isLockdown ? "⚠ Emergency Action" : "Restore Operation"}
                </p>
                <h2 id="hazard-modal-title" className="text-lg font-bold text-white leading-tight">
                  {isLockdown ? "Zone Hazard Lockdown" : "Lift Lockdown"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white rounded-lg p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Zone info */}
          <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
            <AlertTriangle
              className={cn("w-6 h-6 flex-shrink-0 mt-0.5", isLockdown ? "text-red-500" : "text-emerald-500")}
            />
            <div>
              <p className="font-semibold text-gray-900">{zone.name}</p>
              <p className="text-sm text-gray-500">{zone.state}</p>
              <p className="text-xs text-gray-400 mt-1">
                Current status:{" "}
                <span className="font-medium text-gray-700">{zone.status} / {zone.hazard_level}</span>
              </p>
            </div>
          </div>

          {/* Consequence warning */}
          {isLockdown && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 space-y-1.5">
              <p className="text-sm font-semibold text-red-800">This action will immediately:</p>
              <ul className="text-xs text-red-700 space-y-1 list-disc ml-4">
                <li>Set zone status to <strong>CLOSED</strong></li>
                <li>Set hazard level to <strong>LOCKDOWN</strong></li>
                <li>Block all new permit bookings for this zone</li>
                <li>Broadcast alert to all active checkpost scanners</li>
                <li>Log this event in the immutable audit ledger</li>
              </ul>
            </div>
          )}

          {/* Broadcast simulation */}
          {isLockdown && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Radio className="w-4 h-4 animate-pulse" />
              Mass broadcast alert will be sent to all registered guard devices.
            </div>
          )}

          {/* Confirm input */}
          {!success ? (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Type <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-red-700">{CONFIRM_WORD}</span> to proceed
              </label>
              <input
                ref={inputRef}
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAction(); }}
                placeholder="Type CONFIRM here"
                className={cn(
                  "w-full px-4 py-2.5 rounded-xl border-2 font-mono text-center text-lg font-bold transition-colors",
                  isReady
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700",
                  "focus:outline-none focus:ring-2 focus:ring-red-500"
                )}
                autoComplete="off"
                aria-describedby="confirm-help"
              />
              <p id="confirm-help" className="text-[11px] text-gray-400 mt-1 text-center">
                This action is logged and irreversible.
              </p>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-xl p-4 text-center font-bold",
                isLockdown
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              )}
            >
              ✓ {isLockdown ? "LOCKDOWN ACTIVATED" : "ZONE RESTORED"} — {zone.name}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={!isReady || executing}
              className={cn(
                "flex-1 py-2.5 rounded-xl font-bold text-sm text-white transition-all",
                isLockdown
                  ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300"
                  : "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300",
                "disabled:cursor-not-allowed"
              )}
            >
              {executing ? "Executing…" : isLockdown ? "🔒 LOCKDOWN ZONE" : "↑ LIFT LOCKDOWN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
