// src/components/QRDisplay.tsx
// Dynamic screenshot-proof QR with 30-second rotating TOTP salt and animated countdown ring.

import { useEffect, useRef, useState, useCallback } from "react";
import QRCode from "qrcode";
import { RefreshCw, Shield, Download, Info } from "lucide-react";
import type { Permit } from "../lib/types";
import { secondsUntilNextSalt } from "../crypto/permitCrypto";
import { formatISTDateTime, formatISTTime } from "../lib/utils";

export interface QRDisplayProps {
  /** Current signed JWT — displayed as QR code */
  token?: string | null;
  value?: string | null;
  permit?: Permit;
  permitId?: string;
  size?: number;
  /** Called every 30s to get a fresh signed JWT (for new TOTP salt) */
  onRequestRefresh?: () => Promise<string>;
}

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function QRDisplay({ token, value, permit, size = 256, onRequestRefresh }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentToken, setCurrentToken] = useState<string | null>(token ?? value ?? null);
  const [sLeft, setSLeft] = useState(secondsUntilNextSalt());
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  // Draw QR whenever token changes
  useEffect(() => {
    if (!currentToken || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, currentToken, {
      width: size,
      margin: 2,
      color: { dark: "#1A237E", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    }).catch(console.error);
  }, [currentToken, size]);

  // Sync with external token prop changes
  useEffect(() => {
    const next = token ?? value ?? null;
    if (next) setCurrentToken(next);
  }, [token, value]);

  const doRefresh = useCallback(async () => {
    if (!onRequestRefresh) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const fresh = await onRequestRefresh();
      setCurrentToken(fresh);
    } catch (e) {
      setRefreshError("Refresh failed — check your connection.");
    } finally {
      setRefreshing(false);
    }
  }, [onRequestRefresh]);

  // 1-second countdown tick; trigger refresh when window rolls over
  useEffect(() => {
    let prev = secondsUntilNextSalt();
    const id = setInterval(() => {
      const s = secondsUntilNextSalt();
      setSLeft(s);
      // When we cross from 1→30 (new window), request fresh token
      if (s === 30 && prev === 1) {
        doRefresh();
      }
      prev = s;
    }, 1000);
    return () => clearInterval(id);
  }, [doRefresh]);

  // Ring colour transitions: green→amber→red as time runs out
  const ringColor =
    sLeft <= 5 ? "#EF4444" : sLeft <= 10 ? "#F59E0B" : "#10B981";

  const dashOffset = CIRCUMFERENCE * (1 - sLeft / 30);

  const slotEnd = permit ? new Date(permit.slot_end) : null;
  const isExpired = slotEnd ? slotEnd.getTime() < Date.now() : false;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Canvas */}
      <div className="relative">
        <div
          className={`rounded-2xl border-4 border-navy-900 p-3 bg-white shadow-2xl transition-opacity duration-300 ${
            refreshing ? "opacity-40" : "opacity-100"
          }`}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="block rounded-lg"
          />
        </div>

        {/* Refreshing overlay */}
        {refreshing && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 rounded-xl px-4 py-3 flex items-center gap-2 shadow-lg">
              <RefreshCw className="w-5 h-5 text-navy-700 animate-spin" />
              <span className="text-sm font-semibold text-navy-700">Updating QR…</span>
            </div>
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/80 rounded-xl">
            <p className="text-white font-bold text-lg text-center px-4">
              SLOT EXPIRED<br />
              <span className="text-sm font-normal">This permit is no longer valid</span>
            </p>
          </div>
        )}
      </div>

      {/* Countdown Ring + Label */}
      <div className="flex items-center gap-4 bg-gray-50 rounded-2xl px-5 py-3 border border-gray-200">
        <svg width={96} height={96} viewBox="0 0 100 100" aria-hidden="true">
          {/* Track */}
          <circle
            cx={50} cy={50} r={RADIUS}
            fill="none" stroke="#E5E7EB" strokeWidth={7}
          />
          {/* Countdown arc */}
          <circle
            cx={50} cy={50} r={RADIUS}
            fill="none"
            stroke={ringColor}
            strokeWidth={7}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{
              transition: "stroke-dashoffset 0.85s linear, stroke 0.3s ease",
            }}
          />
          {/* Counter text */}
          <text x={50} y={46} textAnchor="middle" fontSize={22} fontWeight="700" fill="#1A237E">
            {sLeft}
          </text>
          <text x={50} y={63} textAnchor="middle" fontSize={11} fill="#6B7280">
            sec
          </text>
        </svg>

        <div className="flex-1">
          <p className="font-semibold text-navy-900 text-sm leading-tight">
            QR refreshes every 30 seconds
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Screenshot-proof dynamic code
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-emerald-700 font-medium">
            <Shield className="w-3.5 h-3.5" />
            Ed25519 digitally signed
          </div>
        </div>
      </div>

      {/* Permit details */}
      {permit && (
        <div className="w-full bg-navy-50 rounded-xl border border-navy-200 px-4 py-3 space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Vehicle</span>
            <span className="font-mono font-bold text-navy-900">{permit.vehicle_reg_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Passengers</span>
            <span className="font-semibold text-navy-900">{permit.passenger_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Valid from</span>
            <span className="font-medium text-navy-900">{formatISTTime(permit.slot_start)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Valid until</span>
            <span className={`font-medium ${isExpired ? "text-red-600" : "text-navy-900"}`}>
              {formatISTDateTime(permit.slot_end)}
            </span>
          </div>
        </div>
      )}

      {/* Refresh error */}
      {refreshError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {refreshError}
        </div>
      )}

      {/* Offline save hint */}
      <p className="text-xs text-gray-400 text-center max-w-xs">
        <Download className="w-3 h-3 inline mr-1" />
        For offline use: take a screenshot within the valid 30-second window shown above.
      </p>
    </div>
  );
}
