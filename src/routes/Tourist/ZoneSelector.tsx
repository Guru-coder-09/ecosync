import React from 'react';
import {
  MapPin,
  Thermometer,
  Cloud,
  Users,
  Wifi,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import { CapacityBar } from '../../components/CapacityBar';
import { capacityPct, cn, hazardBadgeClass, statusBadgeClass } from '../../lib/utils';
import type { Zone } from '../../lib/types';

interface ZoneSelectorProps {
  zones: Zone[];
  onSelect: (z: Zone) => void;
  selectedId: string | null;
}

const HazardIcon: React.FC<{ level: Zone['hazard_level'] }> = ({ level }) => {
  if (level === 'LOCKDOWN') return <Lock className="h-3.5 w-3.5" aria-hidden="true" />;
  if (level === 'WARNING') return <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />;
  return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />;
};

const StatusIcon: React.FC<{ status: Zone['status'] }> = ({ status }) => {
  if (status === 'CLOSED') return <XCircle className="h-3.5 w-3.5" aria-hidden="true" />;
  if (status === 'RESTRICTED') return <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />;
  return <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />;
};

const ZoneCard: React.FC<{
  zone: Zone;
  isSelected: boolean;
  onSelect: (z: Zone) => void;
}> = ({ zone, isSelected, onSelect }) => {
  const isClosed = zone.status === 'CLOSED';
  const pct = capacityPct(zone.current_occupancy, zone.safe_capacity);
  const isHighDemand = pct >= 85;

  return (
    <button
      type="button"
      disabled={isClosed}
      onClick={() => !isClosed && onSelect(zone)}
      aria-pressed={isSelected}
      aria-disabled={isClosed}
      className={cn(
        'relative flex w-full flex-col rounded-xl border-2 bg-white p-4 text-left shadow-sm transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2',
        isClosed
          ? 'cursor-not-allowed opacity-40 grayscale border-gray-200'
          : isSelected
          ? 'border-navy-900 ring-2 ring-navy-900 ring-offset-1 shadow-md'
          : 'cursor-pointer border-gray-200 hover:border-navy-200 hover:shadow-md'
      )}
    >
      {/* High Demand badge */}
      {isHighDemand && !isClosed && (
        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-300">
          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
          High Demand
        </span>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <span className="absolute left-3 top-3 rounded-full bg-navy-900 p-0.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-white" aria-hidden="true" />
        </span>
      )}

      {/* Zone name */}
      <h3
        className={cn(
          'mt-1 truncate pr-20 text-base font-bold leading-tight',
          isSelected ? 'text-navy-900' : 'text-gray-900'
        )}
      >
        {zone.name}
      </h3>

      {/* State badge */}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-900">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {zone.state}
        </span>
      </div>

      {/* Weather status */}
      <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
        <Cloud className="h-3.5 w-3.5 flex-shrink-0 text-sky-500" aria-hidden="true" />
        <span className="truncate">{zone.weather_status || 'N/A'}</span>
        <Thermometer className="ml-1 h-3.5 w-3.5 flex-shrink-0 text-orange-400" aria-hidden="true" />
      </div>

      {/* Capacity */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            Capacity
          </span>
          <span className="tabular-nums font-medium text-gray-700">
            {zone.current_occupancy}/{zone.safe_capacity}
          </span>
        </div>
        <CapacityBar
          current={zone.current_occupancy}
          capacity={zone.safe_capacity}
          className="w-full"
        />
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {/* Status badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            statusBadgeClass(zone.status)
          )}
        >
          <StatusIcon status={zone.status} />
          {zone.status}
        </span>

        {/* Hazard badge */}
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            hazardBadgeClass(zone.hazard_level)
          )}
        >
          <HazardIcon level={zone.hazard_level} />
          {zone.hazard_level}
        </span>

        {/* FASTag gateways */}
        {zone.fastag_gateways > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700">
            <Wifi className="h-3 w-3" aria-hidden="true" />
            {zone.fastag_gateways} FASTag
          </span>
        )}
      </div>

      {/* Closed overlay label */}
      {isClosed && (
        <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-gray-500">
          <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
          Zone Closed — Entry Not Permitted
        </div>
      )}
    </button>
  );
};

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({ zones, onSelect, selectedId }) => {
  const openZones = zones.filter((z) => z.status !== 'CLOSED');
  const closedZones = zones.filter((z) => z.status === 'CLOSED');
  const sorted = [...openZones, ...closedZones];

  if (zones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Cloud className="mb-3 h-10 w-10 text-gray-300" aria-hidden="true" />
        <p className="text-sm font-medium text-gray-500">No ecological zones available right now.</p>
        <p className="mt-1 text-xs text-gray-400">Please check back later.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-500">
          {openZones.length} zone{openZones.length !== 1 ? 's' : ''} available for booking
          {closedZones.length > 0 && ` · ${closedZones.length} closed`}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((zone) => (
          <ZoneCard
            key={zone.id}
            zone={zone}
            isSelected={selectedId === zone.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};
