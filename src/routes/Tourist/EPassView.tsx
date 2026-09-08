import React, { useEffect, useCallback, useState } from 'react';
import {
  RefreshCw,
  Download,
  PlusCircle,
  MapPin,
  Car,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  Wifi,
  Printer,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { QRDisplay } from '../../components/QRDisplay';
import { usePermitStore } from '../../stores/permitStore';
import { useAuthStore } from '../../stores/authStore';
import {
  formatISTDateTime,
  formatISTDate,
  formatISTTime,
  cn,
  permitStatusBadgeClass,
} from '../../lib/utils';
import type { Permit } from '../../lib/types';

interface EPassViewProps {
  permit: Permit;
  onNewBooking: () => void;
}

const TOKEN_REFRESH_INTERVAL_MS = 30_000;

const StatusBanner: React.FC<{ status: Permit['status'] }> = ({ status }) => {
  if (status === 'ACTIVE') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-eco-800/10 px-4 py-2.5 text-sm font-semibold text-eco-800">
        <CheckCircle2 className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>Permit is <strong>ACTIVE</strong> — valid for entry at the selected zone.</span>
      </div>
    );
  }
  if (status === 'USED') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-800">
        <ShieldCheck className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>Permit has been <strong>USED</strong>. Thank you for visiting.</span>
      </div>
    );
  }
  if (status === 'EXPIRED') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
        <XCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>This permit has <strong>EXPIRED</strong>. Please book a new one.</span>
      </div>
    );
  }
  if (status === 'REVOKED') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
        <span>This permit has been <strong>REVOKED</strong> by authorities.</span>
      </div>
    );
  }
  return null;
};

export const EPassView: React.FC<EPassViewProps> = ({ permit, onNewBooking }) => {
  const { requestSignedToken } = usePermitStore();
  const { session } = useAuthStore();
  const [signedToken, setSignedToken] = useState<string | null>(permit.signed_token ?? null);
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const refreshToken = useCallback(async () => {
    if (permit.status !== 'ACTIVE') return;
    setTokenLoading(true);
    setTokenError(null);
    try {
      const token = await requestSignedToken(permit, session?.access_token ?? undefined);
      setSignedToken(token);
      setLastRefreshed(new Date());
    } catch (err) {
      setTokenError('Unable to refresh QR token. Please check your connection.');
    } finally {
      setTokenLoading(false);
    }
  }, [permit, session, requestSignedToken]);

  // On mount: immediately request signed token if missing
  useEffect(() => {
    if (!permit.signed_token) {
      refreshToken();
    } else {
      setLastRefreshed(new Date());
    }
  }, [permit.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30 seconds for ACTIVE permits
  useEffect(() => {
    if (permit.status !== 'ACTIVE') return;
    const interval = setInterval(() => {
      refreshToken();
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [permit.status, refreshToken]);

  const zoneName = permit.zones?.name ?? 'Ecological Zone';
  const zoneState = permit.zones?.state ?? '';
  const permitNumber = permit.id.toUpperCase().slice(0, 8);

  return (
    <div className="space-y-5">
      {/* GoI E-Pass Header */}
      <div className="overflow-hidden rounded-xl border border-navy-200 bg-white shadow-md print:shadow-none">
        {/* Tricolor band */}
        <div className="flex h-2" aria-hidden="true">
          <div className="flex-1 bg-saffron-900" />
          <div className="flex-1 bg-white border-y border-gray-200" />
          <div className="flex-1 bg-eco-800" />
        </div>

        <div className="px-5 py-4">
          {/* Header row */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl" role="img" aria-label="Ashoka Chakra">☸</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Government of India
                  </p>
                  <p className="text-xs font-bold text-navy-900">
                    Ministry of Environment, Forest & Climate Change
                  </p>
                </div>
              </div>
              <h2 className="mt-1 text-lg font-bold text-navy-900">
                Ecological E-Permit
              </h2>
              <p className="text-[11px] text-gray-400">ई-परमिट (EcoSync DPI)</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                Permit No.
              </p>
              <p className="font-mono text-sm font-bold text-navy-900 tabular-nums">
                #{permitNumber}
              </p>
              <p className="mt-1 text-[10px] text-gray-400">
                Issued: {formatISTDate(permit.created_at)}
              </p>
              <span
                className={cn(
                  'mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  permitStatusBadgeClass(permit.status)
                )}
              >
                {permit.status}
              </span>
            </div>
          </div>

          {/* Status banner */}
          <div className="mt-4">
            <StatusBanner status={permit.status} />
          </div>
        </div>
      </div>

      {/* QR Code section */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700">Digital Scan Token</h3>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-[10px] text-gray-400">
                Refreshed {formatISTTime(lastRefreshed.toISOString())}
              </span>
            )}
            <button
              type="button"
              onClick={refreshToken}
              disabled={tokenLoading || permit.status !== 'ACTIVE'}
              aria-label="Refresh QR token"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RefreshCw
                className={cn('h-3.5 w-3.5', tokenLoading && 'animate-spin')}
                aria-hidden="true"
              />
              {tokenLoading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>

        {tokenError && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {tokenError}
          </div>
        )}

        <div className="flex justify-center">
          {tokenLoading && !signedToken ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-xl bg-gray-50">
              <svg
                className="h-8 w-8 animate-spin text-navy-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-label="Loading QR code"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          ) : signedToken ? (
            <QRDisplay
              value={signedToken}
              permitId={permit.id}
              size={192}
            />
          ) : (
            <div className="flex h-48 w-48 flex-col items-center justify-center rounded-xl bg-gray-50 text-center">
              <Wifi className="mb-2 h-8 w-8 text-gray-300" aria-hidden="true" />
              <p className="text-xs text-gray-400">QR unavailable. Tap Refresh.</p>
            </div>
          )}
        </div>

        {permit.status === 'ACTIVE' && (
          <p className="mt-3 text-center text-[11px] text-gray-400">
            Auto-refreshes every 30 seconds · Present at FASTag gateway
          </p>
        )}
      </div>

      {/* Permit Details */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-3">
          <h3 className="text-sm font-bold text-gray-700">Permit Details</h3>
        </div>
        <dl className="divide-y divide-gray-100">
          <div className="flex items-center gap-3 px-5 py-3">
            <MapPin className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">Zone</dt>
            <dd className="text-sm font-semibold text-gray-900">
              {zoneName}
              {zoneState && (
                <span className="ml-1.5 rounded-full bg-navy-50 px-1.5 py-0.5 text-[10px] font-medium text-navy-900">
                  {zoneState}
                </span>
              )}
            </dd>
          </div>

          <div className="flex items-center gap-3 px-5 py-3">
            <Calendar className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">Entry</dt>
            <dd className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatISTDateTime(permit.slot_start)}
            </dd>
          </div>

          <div className="flex items-center gap-3 px-5 py-3">
            <Clock className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">Exit</dt>
            <dd className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatISTDateTime(permit.slot_end)}
            </dd>
          </div>

          <div className="flex items-center gap-3 px-5 py-3">
            <Car className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">Vehicle</dt>
            <dd className="font-mono text-sm font-bold tracking-widest text-gray-900">
              {permit.vehicle_reg_number}
            </dd>
          </div>

          <div className="flex items-center gap-3 px-5 py-3">
            <Users className="h-4 w-4 flex-shrink-0 text-navy-900" aria-hidden="true" />
            <dt className="w-32 flex-shrink-0 text-xs font-medium text-gray-500">Passengers</dt>
            <dd className="text-sm font-semibold text-gray-900 tabular-nums">
              {permit.passenger_count} person{permit.passenger_count !== 1 ? 's' : ''}
            </dd>
          </div>

          {permit.discount_applied && (
            <div className="flex items-center gap-3 px-5 py-3 bg-eco-800/5">
              <Tag className="h-4 w-4 flex-shrink-0 text-eco-800" aria-hidden="true" />
              <dt className="w-32 flex-shrink-0 text-xs font-medium text-eco-800">Discount</dt>
              <dd className="text-sm font-bold text-eco-800">
                {permit.discount_percent}% Ecological Incentive Applied ✓
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Offline guidance */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3.5">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" aria-hidden="true" />
          <div className="text-xs text-blue-700 space-y-1">
            <p className="font-semibold">Save Your E-Pass for Offline Access</p>
            <ul className="list-disc list-inside space-y-0.5 text-blue-600">
              <li>Screenshot or print this page before entering the forest zone.</li>
              <li>Network connectivity may be unavailable inside ecological zones.</li>
              <li>The QR code contains your signed permit data for offline verification.</li>
              <li>Present the QR code at FASTag gateways for automated entry clearance.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </button>
          <button
            type="button"
            onClick={() => {
              // Basic download: open print dialog with PDF target
              window.print();
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Save PDF
          </button>
        </div>
        <button
          type="button"
          onClick={onNewBooking}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-saffron-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-saffron-900 focus:ring-offset-2 active:scale-95"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          Book Another Permit
        </button>
      </div>
    </div>
  );
};
