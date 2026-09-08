import React, { useMemo } from 'react';
import { Users, Gauge, Radio, AlertTriangle } from 'lucide-react';
import { capacityPct, cn } from '../../lib/utils';
import type { Zone } from '../../lib/types';

interface StatCardsProps {
  zones: Zone[];
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: string;
  accentClass: string;
  iconBgClass: string;
  valueClass?: string;
}

function StatCard({ icon, label, value, trend, accentClass, iconBgClass, valueClass }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-md flex items-stretch overflow-hidden',
        'border border-gray-200',
      )}
    >
      {/* Left accent stripe */}
      <div className={cn('w-1.5 flex-shrink-0', accentClass)} />

      {/* Icon column */}
      <div className="flex items-center justify-center px-4 py-5">
        <div className={cn('p-3 rounded-full', iconBgClass)}>
          {icon}
        </div>
      </div>

      {/* Text column */}
      <div className="flex flex-col justify-center py-5 pr-5 flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest truncate">
          {label}
        </p>
        <p className={cn('text-3xl font-extrabold mt-0.5 leading-none', valueClass ?? 'text-gray-900')}>
          {value}
        </p>
        <p className="text-xs text-gray-400 mt-1 truncate">{trend}</p>
      </div>
    </div>
  );
}

export function StatCards({ zones }: StatCardsProps) {
  const stats = useMemo(() => {
    const totalHeadcount = zones.reduce((sum, z) => sum + z.current_occupancy, 0);

    const nonClosedZones = zones.filter((z) => z.status !== 'CLOSED');
    const avgCapacity =
      nonClosedZones.length > 0
        ? nonClosedZones.reduce(
            (sum, z) => sum + capacityPct(z.current_occupancy, z.safe_capacity),
            0,
          ) / nonClosedZones.length
        : 0;

    const totalGateways = zones.reduce((sum, z) => sum + z.fastag_gateways, 0);
    const zonesAtRisk = zones.filter((z) => z.hazard_level !== 'NORMAL').length;

    return { totalHeadcount, avgCapacity, totalGateways, zonesAtRisk };
  }, [zones]);

  // Avg Capacity colour logic
  const avgCapacityAccent =
    stats.avgCapacity > 85 ? 'bg-red-700' : stats.avgCapacity > 70 ? 'bg-amber-500' : 'bg-[#00695C]';
  const avgCapacityIconBg =
    stats.avgCapacity > 85 ? 'bg-red-100' : stats.avgCapacity > 70 ? 'bg-amber-100' : 'bg-teal-100';
  const avgCapacityIconColor =
    stats.avgCapacity > 85
      ? 'text-red-700'
      : stats.avgCapacity > 70
      ? 'text-amber-600'
      : 'text-[#00695C]';
  const avgCapacityValueClass =
    stats.avgCapacity > 85
      ? 'text-red-700'
      : stats.avgCapacity > 70
      ? 'text-amber-600'
      : 'text-[#00695C]';
  const avgCapacityTrend =
    stats.avgCapacity > 85
      ? 'Critical — above safe threshold'
      : stats.avgCapacity > 70
      ? 'Elevated — approaching threshold'
      : 'Normal — within safe limits';

  // Zones at Risk colour logic
  const riskAccent = stats.zonesAtRisk > 0 ? 'bg-red-700' : 'bg-[#00695C]';
  const riskIconBg = stats.zonesAtRisk > 0 ? 'bg-red-100' : 'bg-teal-100';
  const riskIconColor = stats.zonesAtRisk > 0 ? 'text-red-700' : 'text-[#00695C]';
  const riskValueClass = stats.zonesAtRisk > 0 ? 'text-red-700' : 'text-[#00695C]';
  const riskTrend =
    stats.zonesAtRisk > 0
      ? `${stats.zonesAtRisk} zone${stats.zonesAtRisk > 1 ? 's' : ''} need${
          stats.zonesAtRisk === 1 ? 's' : ''
        } attention`
      : 'All zones operating normally';

  const cards: StatCardProps[] = [
    {
      icon: <Users size={22} className="text-[#1A237E]" />,
      label: 'Total Active Headcount',
      value: stats.totalHeadcount.toLocaleString('en-IN'),
      trend: `Across ${zones.length} registered zone${zones.length !== 1 ? 's' : ''}`,
      accentClass: 'bg-[#1A237E]',
      iconBgClass: 'bg-indigo-100',
      valueClass: 'text-[#1A237E]',
    },
    {
      icon: <Gauge size={22} className={avgCapacityIconColor} />,
      label: 'Avg Capacity Utilisation',
      value: `${stats.avgCapacity.toFixed(1)}%`,
      trend: avgCapacityTrend,
      accentClass: avgCapacityAccent,
      iconBgClass: avgCapacityIconBg,
      valueClass: avgCapacityValueClass,
    },
    {
      icon: <Radio size={22} className="text-[#FF6F00]" />,
      label: 'Active FASTag Gateways',
      value: stats.totalGateways.toLocaleString('en-IN'),
      trend: 'Electronic toll & permit scanning nodes',
      accentClass: 'bg-[#FF6F00]',
      iconBgClass: 'bg-orange-100',
      valueClass: 'text-[#FF6F00]',
    },
    {
      icon: <AlertTriangle size={22} className={riskIconColor} />,
      label: 'Zones at Risk',
      value: stats.zonesAtRisk,
      trend: riskTrend,
      accentClass: riskAccent,
      iconBgClass: riskIconBg,
      valueClass: riskValueClass,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
