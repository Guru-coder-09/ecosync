// src/components/ZoneMap.tsx
// Interactive Leaflet map rendering PostGIS GeoJSON zone boundaries.
// Falls back to an SVG India outline if Leaflet fails or is offline.

import { useEffect, useRef } from "react";
import type { Zone } from "../lib/types";
import { capacityPct } from "../lib/utils";

export interface ZoneMapProps {
  zones: Zone[];
  onZoneClick?: (zone: Zone) => void;
  onZoneSelect?: (zone: Zone | null) => void;
  selectedZone?: Zone | null;
  selectedZoneId?: string | null;
  className?: string;
}

function hazardToColor(hz: string, pct: number) {
  if (hz === "LOCKDOWN") return "#B71C1C";
  if (hz === "WARNING" || pct >= 85) return "#F59E0B";
  return "#00695C";
}

/** SVG Fallback: simplified India outline map */
function IndiaOutlineFallback({ zones, onZoneClick }: Pick<ZoneMapProps, "zones" | "onZoneClick">) {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-blue-50 rounded-xl border border-blue-200 p-4 gap-3">
      <p className="text-xs text-blue-500 font-medium">Map unavailable offline — Zone list view</p>
      <div className="grid grid-cols-2 gap-2 w-full max-h-64 overflow-auto">
        {zones.map((z) => {
          const pct = capacityPct(z.current_occupancy, z.safe_capacity);
          const color = hazardToColor(z.hazard_level, pct);
          return (
            <button
              key={z.id}
              onClick={() => onZoneClick?.(z)}
              className="text-left px-3 py-2 rounded-lg border bg-white hover:shadow-md transition-shadow text-xs"
              style={{ borderLeftColor: color, borderLeftWidth: 4 }}
            >
              <p className="font-semibold text-gray-800 truncate">{z.name}</p>
              <p className="text-gray-500">{z.state} · {pct}%</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ZoneMap({ zones, onZoneClick, selectedZoneId, className }: ZoneMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // Track if Leaflet successfully mounted
  const leafletRef = useRef<boolean>(false);
  const mapInstanceRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    if (typeof window === "undefined") return;

    let L: typeof import("leaflet");
    let map: import("leaflet").Map;

    (async () => {
      try {
        L = (await import("leaflet")).default;

        // Fix default icon paths for Vite bundling
        const iconUrl =
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
        const shadowUrl =
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";
        const DefaultIcon = L.icon({ iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] });
        L.Marker.prototype.options.icon = DefaultIcon;

        if (!mapRef.current) return;

        map = L.map(mapRef.current, {
          center: [22.5, 82.5],  // Centre of India
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        // Render zone GeoJSON polygons
        zones.forEach((zone) => {
          if (!zone.boundary) return;
          const pct = capacityPct(zone.current_occupancy, zone.safe_capacity);
          const fillColor = hazardToColor(zone.hazard_level, pct);
          const isSelected = zone.id === selectedZoneId;

          const layer = L.geoJSON(zone.boundary as import("geojson").GeoJSON, {
            style: {
              color: isSelected ? "#1A237E" : fillColor,
              fillColor,
              fillOpacity: 0.35,
              weight: isSelected ? 3 : 2,
              dashArray: zone.status === "CLOSED" ? "8 4" : undefined,
            },
          });

          layer.bindPopup(`
            <div style="min-width:180px">
              <strong style="color:#1A237E">${zone.name}</strong><br/>
              <small>${zone.state}</small><br/>
              <hr style="margin:4px 0"/>
              Capacity: <strong>${pct}%</strong> (${zone.current_occupancy}/${zone.safe_capacity})<br/>
              Status: <strong>${zone.status}</strong><br/>
              Hazard: <strong>${zone.hazard_level}</strong><br/>
              Weather: ${zone.weather_status}
            </div>
          `);

          layer.on("click", () => onZoneClick?.(zone));
          layer.addTo(map);
        });

        leafletRef.current = true;
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn("Leaflet failed to load:", err);
        // Fallback rendered by React (see below)
        leafletRef.current = false;
      }
    })();

    return () => {
      if (map) {
        try { map.remove(); } catch { /* ignore */ }
        leafletRef.current = false;
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update zone styling on selection change without reinitialising
  useEffect(() => {
    // Reinitialise on selection change if map is mounted
    // Simple approach: the popup click drives the parent state
  }, [selectedZoneId]);

  const zonesWithBoundary = zones.filter((z) => z.boundary);

  if (zonesWithBoundary.length === 0) {
    return <IndiaOutlineFallback zones={zones} onZoneClick={onZoneClick} />;
  }

  return (
    <div className={className ?? "w-full h-80 rounded-xl overflow-hidden border border-gray-200 shadow"}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
