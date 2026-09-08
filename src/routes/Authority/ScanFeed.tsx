import React, { useEffect, useRef, useMemo } from 'react';
import { ShieldCheck, ShieldX, Clock, Wifi, WifiOff } from 'lucide-react';
import { formatISTTime, cn } from '../../lib/utils';
import type { ScanLog, Zone } from '../../lib/types';

interface ScanFeedProps {
  scans: ScanLog[];
  zones: Zone[];
}

const OFFLINE_THRESHOLD_MS = 60_000; // 60 seconds

function isOfflineSynced(scan: ScanLog): boolean {
  if (!scan.offline_captured_at) return false;
  const captured = new Date(scan.offline_captured_at).getTime();
  const created = new Date(scan.created_at).getTime();
  return Math.abs(created - captured) > OFFLINE_THRESHOLD_MS;
}

export function ScanFeed({ scans, zones }: ScanFeedProps) {
  const tableTopRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(scans.length);

  // Auto-scroll to top when new entries arrive
  useEffect(() => {
    if (scans.length > prevLengthRef.current) {
      tableTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    prevLengthRef.current = scans.length;
  }, [scans.length]);

  const zoneMap = useMemo(() => new Map(zones.map((z) => [z.id, z.name])), [zones]);

  const displayedScans = scans.slice(0, 50);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-[#1A237E]" />
          <h3 className="text-sm font-semibold text-[#1A237E] uppercase tracking-wider">
            Live Scan Feed
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          <span className="text-xs text-gray-500">Live</span>
          {scans.length > 0 && (
            <span className="ml-2 text-xs text-gray-400">
              {Math.min(scans.length, 50)} of {scans.length} entries
            </span>
          )}
        </div>
      </div>

      {/* Scroll anchor */}
      <div ref={tableTopRef} />

      {/* Table body */}
      <div className="overflow-auto max-h-[420px]">
        {displayedScans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
            <Wifi size={36} className="text-gray-300" />
            <p className="text-sm font-medium">No scans yet — live feed will appear here</p>
            <p className="text-xs">Waiting for guard scan events…</p>
          </div>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Time (IST)
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">
                  Failure Reason
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-500 uppercase tracking-wider">
                  Sync
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedScans.map((scan, idx) => {
                const offline = isOfflineSynced(scan);
                const zoneName = zoneMap.get(scan.zone_id) ?? scan.zone_id;

                return (
                  <tr
                    key={scan.id}
                    className={cn(
                      'transition-colors',
                      idx === 0 && scan.verified && 'bg-blue-50',
                      !scan.verified && 'bg-red-50 hover:bg-red-100',
                      idx > 0 && scan.verified && 'hover:bg-gray-50',
                    )}
                  >
                    {/* Time */}
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 font-mono">
                      {formatISTTime(scan.created_at)}
                    </td>

                    {/* Zone name */}
                    <td className="px-3 py-2 max-w-[140px]">
                      <span className="block truncate text-gray-800 font-medium" title={zoneName}>
                        {zoneName}
                      </span>
                    </td>

                    {/* Scan type badge */}
                    <td className="px-3 py-2">
                      {scan.scan_type === 'ENTRY' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                          Entry
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-600 uppercase tracking-wide">
                          Exit
                        </span>
                      )}
                    </td>

                    {/* Verified icon */}
                    <td className="px-3 py-2 text-center">
                      {scan.verified ? (
                        <ShieldCheck
                          size={16}
                          className="text-[#00695C] inline-block"
                          aria-label="Verified"
                        />
                      ) : (
                        <ShieldX
                          size={16}
                          className="text-red-600 inline-block"
                          aria-label="Not verified"
                        />
                      )}
                    </td>

                    {/* Failure reason */}
                    <td className="px-3 py-2">
                      {scan.failure_reason ? (
                        <span
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 max-w-[160px] truncate"
                          title={scan.failure_reason}
                        >
                          {scan.failure_reason}
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>

                    {/* Sync status */}
                    <td className="px-3 py-2 text-center">
                      {offline ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700"
                          title={`Offline captured: ${scan.offline_captured_at}`}
                        >
                          <WifiOff size={10} />
                          Offline
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                          <Wifi size={10} />
                          Online
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
