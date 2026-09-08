// src/components/CapacityBar.tsx
// Reusable animated capacity progress bar with colour-coded states.

import { capacityPct, capacityBarClass, capacityColorClass, cn } from "../lib/utils";

export interface CapacityBarProps {
  current?: number;
  safe?: number;
  capacity?: number;
  percent?: number;
  showNumbers?: boolean;
  height?: "sm" | "md" | "lg";
  className?: string;
}

export function CapacityBar({
  current = 0,
  safe,
  capacity,
  percent,
  showNumbers = true,
  height = "md",
  className,
}: CapacityBarProps) {
  const effectiveSafe = safe ?? capacity ?? 100;
  const pct = percent !== undefined ? Math.round(percent) : capacityPct(current, effectiveSafe);
  const barColor = capacityBarClass(pct);
  const textColor = capacityColorClass(pct);

  const heightClass = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  }[height];

  const label =
    pct >= 95 ? "CRITICAL — Near Full"
    : pct >= 85 ? "HIGH — Approaching Limit"
    : pct >= 70 ? "MODERATE"
    : "NORMAL";

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="flex justify-between items-center mb-1.5">
          <span className={cn("text-xs font-semibold", textColor)}>{label}</span>
          <span className={cn("text-xs font-mono font-bold tabular-nums", textColor)}>
            {percent !== undefined ? (
              <span>{pct}%</span>
            ) : (
              <>
                {current.toLocaleString("en-IN")} / {effectiveSafe.toLocaleString("en-IN")}{" "}
                <span className="font-normal text-gray-400">({pct}%)</span>
              </>
            )}
          </span>
        </div>
      )}

      {/* Track */}
      <div className={cn("w-full bg-gray-200 rounded-full overflow-hidden", heightClass)}>
        {/* Fill */}
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", barColor)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Capacity ${pct}%`}
        />
      </div>

      {/* 85% warning marker */}
      {showNumbers && (
        <div className="relative h-0">
          <div
            className="absolute top-0 w-0.5 h-3 bg-amber-500/60 -translate-y-3"
            style={{ left: "85%" }}
            title="85% capacity threshold"
          />
        </div>
      )}
    </div>
  );
}
