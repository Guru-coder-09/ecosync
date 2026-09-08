import React, { useState, useMemo, useCallback } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { CapacityBar } from '../../components/CapacityBar';
import { capacityPct, hazardBadgeClass, statusBadgeClass, cn } from '../../lib/utils';
import type { Zone, ZoneStatus } from '../../lib/types';

interface ZoneControlPanelProps {
  zones: Zone[];
  onLockdown: (zone: Zone) => void;
  onLiftLockdown: (zone: Zone) => void;
  onUpdateCapacity: (id: string, capacity: number) => void;
}

const ALL_STATUSES: ZoneStatus[] = ['OPEN', 'RESTRICTED', 'CLOSED'];

export function ZoneControlPanel({
  zones,
  onLockdown,
  onLiftLockdown,
  onUpdateCapacity,
}: ZoneControlPanelProps) {
  // Filter state
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [selectedStatuses, setSelectedStatuses] = useState<Set<ZoneStatus>>(
    new Set(ALL_STATUSES),
  );

  // Inline capacity edit state keyed by zone id
  const [capacityEdits, setCapacityEdits] = useState<Record<string, string>>({});

  // Unique states for dropdown
  const stateOptions = useMemo(() => {
    const states = Array.from(new Set(zones.map((z) => z.state))).sort();
    return ['ALL', ...states];
  }, [zones]);

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const stateMatch = selectedState === 'ALL' || z.state === selectedState;
      const statusMatch = selectedStatuses.has(z.status);
      return stateMatch && statusMatch;
    });
  }, [zones, selectedState, selectedStatuses]);

  const toggleStatus = useCallback((status: ZoneStatus) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        // Keep at least one selected
        if (next.size > 1) next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  }, []);

  const handleCapacityBlur = useCallback(
    (zone: Zone) => {
      const raw = capacityEdits[zone.id];
      if (raw === undefined) return;
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed !== zone.safe_capacity) {
        onUpdateCapacity(zone.id, parsed);
      }
      setCapacityEdits((prev) => {
        const next = { ...prev };
        delete next[zone.id];
        return next;
      });
    },
    [capacityEdits, onUpdateCapacity],
  );

  const rowHighlight = (zone: Zone) => {
    if (zone.hazard_level === 'LOCKDOWN') return 'bg-red-50 hover:bg-red-100';
    if (zone.hazard_level === 'WARNING') return 'bg-amber-50 hover:bg-amber-100';
    return 'hover:bg-gray-50';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1A237E] uppercase tracking-wider">
            Zone Control Panel
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {filteredZones.length} of {zones.length} zones shown
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* State dropdown */}
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="appearance-none text-xs border border-gray-300 rounded px-2.5 py-1.5 pr-7 text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-[#1A237E] cursor-pointer"
            >
              {stateOptions.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All States' : s}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
          </div>

          {/* Status checkboxes */}
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-gray-400" />
            {ALL_STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStatuses.has(s)}
                  onChange={() => toggleStatus(s)}
                  className="h-3 w-3 accent-[#1A237E]"
                />
                <span
                  className={cn(
                    'text-[10px] font-semibold uppercase',
                    s === 'OPEN' && 'text-green-700',
                    s === 'RESTRICTED' && 'text-amber-700',
                    s === 'CLOSED' && 'text-red-700',
                  )}
                >
                  {s}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Table — horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        {filteredZones.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">
            No zones match the current filters.
          </div>
        ) : (
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {[
                  'Zone Name',
                  'State',
                  'Status',
                  'Hazard',
                  'Capacity',
                  'Safe Cap.',
                  'Occupancy',
                  'FASTag GW',
                  'Weather',
                  'Actions',
                ].map((col) => (
                  <th
                    key={col}
                    className="px-3 py-2.5 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredZones.map((zone) => {
                const pct = capacityPct(zone.current_occupancy, zone.safe_capacity);
                const capacityValue =
                  capacityEdits[zone.id] !== undefined
                    ? capacityEdits[zone.id]
                    : String(zone.safe_capacity);

                return (
                  <tr key={zone.id} className={cn('transition-colors', rowHighlight(zone))}>
                    {/* Zone Name */}
                    <td className="px-3 py-2.5 font-semibold text-gray-800 whitespace-nowrap max-w-[160px]">
                      <span className="block truncate" title={zone.name}>
                        {zone.name}
                      </span>
                    </td>

                    {/* State */}
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{zone.state}</td>

                    {/* Status badge */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                          statusBadgeClass(zone.status),
                        )}
                      >
                        {zone.status}
                      </span>
                    </td>

                    {/* Hazard badge */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                          hazardBadgeClass(zone.hazard_level),
                        )}
                      >
                        {zone.hazard_level}
                      </span>
                    </td>

                    {/* Capacity bar */}
                    <td className="px-3 py-2.5 min-w-[100px]">
                      <CapacityBar percent={pct} />
                    </td>

                    {/* Safe capacity — inline editable */}
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min={1}
                        value={capacityValue}
                        onChange={(e) =>
                          setCapacityEdits((prev) => ({ ...prev, [zone.id]: e.target.value }))
                        }
                        onBlur={() => handleCapacityBlur(zone)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        className={cn(
                          'w-20 text-xs border rounded px-1.5 py-1 text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#1A237E]',
                          capacityEdits[zone.id] !== undefined
                            ? 'border-amber-400 bg-amber-50'
                            : 'border-gray-300 bg-white',
                        )}
                        title="Edit safe capacity and press Enter or click away to save"
                      />
                    </td>

                    {/* Current occupancy */}
                    <td className="px-3 py-2.5 text-gray-700 font-mono whitespace-nowrap">
                      {zone.current_occupancy.toLocaleString('en-IN')}
                    </td>

                    {/* FASTag gateways */}
                    <td className="px-3 py-2.5 text-gray-700 text-center">{zone.fastag_gateways}</td>

                    {/* Weather */}
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap max-w-[110px]">
                      <span className="block truncate" title={zone.weather_status}>
                        {zone.weather_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {zone.status !== 'CLOSED' ? (
                        <button
                          onClick={() => onLockdown(zone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-red-700 text-white hover:bg-red-800 active:bg-red-900 transition-colors shadow-sm"
                          title={`Initiate lockdown for ${zone.name}`}
                        >
                          🔒 Lockdown
                        </button>
                      ) : (
                        <button
                          onClick={() => onLiftLockdown(zone)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold bg-[#00695C] text-white hover:bg-teal-700 active:bg-teal-800 transition-colors shadow-sm"
                          title={`Lift lockdown for ${zone.name}`}
                        >
                          ↑ Lift
                        </button>
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
