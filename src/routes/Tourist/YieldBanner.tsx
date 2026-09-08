import React from 'react';
import { AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { CapacityBar } from '../../components/CapacityBar';
import { capacityPct, cn } from '../../lib/utils';
import type { Zone } from '../../lib/types';

interface YieldBannerProps {
  selectedZone: Zone;
  alternativeZones: Zone[];
  onSelectAlternative: (z: Zone) => void;
  discount: number;
}

export const YieldBanner: React.FC<YieldBannerProps> = ({
  selectedZone,
  alternativeZones,
  onSelectAlternative,
  discount,
}) => {
  const pct = capacityPct(selectedZone.current_occupancy, selectedZone.safe_capacity);
  const alternatives = alternativeZones
    .filter(
      (z) =>
        z.id !== selectedZone.id &&
        z.status !== 'CLOSED' &&
        capacityPct(z.current_occupancy, z.safe_capacity) < 85
    )
    .slice(0, 3);

  return (
    <div
      role="alert"
      aria-live="polite"
      className="rounded-xl border border-amber-400 bg-amber-50 p-4 shadow-sm"
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex-shrink-0 rounded-full bg-amber-100 p-1.5">
          <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">
            High Demand —{' '}
            <span className="font-bold">{selectedZone.name}</span> is at{' '}
            <span className="tabular-nums font-bold">{Math.round(pct)}%</span> capacity
          </p>
          <p className="mt-0.5 text-xs text-amber-700">
            This zone is nearing its safe ecological limit. Consider switching to a less crowded
            zone. Switching now unlocks a{' '}
            <span className="font-semibold text-amber-900">{discount}% discount</span> on your
            permit.
          </p>
        </div>
      </div>

      {/* Capacity pill */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-medium text-amber-700">Current occupancy:</span>
        <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-900 tabular-nums">
          {selectedZone.current_occupancy} / {selectedZone.safe_capacity} visitors
        </span>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Available Alternatives
          </p>
          <ul className="space-y-2">
            {alternatives.map((zone) => {
              const altPct = capacityPct(zone.current_occupancy, zone.safe_capacity);
              return (
                <li
                  key={zone.id}
                  className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-navy-900">
                        {zone.name}
                      </span>
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-[10px] font-medium text-navy-900 flex-shrink-0">
                        {zone.state}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <CapacityBar
                        current={zone.current_occupancy}
                        capacity={zone.safe_capacity}
                        className="w-24 flex-shrink-0"
                      />
                      <span
                        className={
                          altPct < 60
                            ? 'text-xs font-medium tabular-nums text-eco-800'
                            : altPct < 75
                            ? 'text-xs font-medium tabular-nums text-amber-600'
                            : 'text-xs font-medium tabular-nums text-orange-600'
                        }
                      >
                        {Math.round(altPct)}% full
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectAlternative(zone)}
                    className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-saffron-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-saffron-900 focus:ring-offset-1 active:scale-95"
                  >
                    <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                    Switch + {discount}% discount
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {alternatives.length === 0 && (
        <p className="mt-3 text-xs italic text-amber-700">
          No alternative zones available right now. You may still proceed with this zone.
        </p>
      )}
    </div>
  );
};
