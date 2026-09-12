// src/map/helpers.ts
// Pure utility functions — no React, no side effects

/** Haversine distance between two lat/lng points in metres */
export function haversine(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R   = 6371000;
  const toR = (v: number) => (v * Math.PI) / 180;
  const dLat = toR(lat2 - lat1);
  const dLng = toR(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(lat1)) * Math.cos(toR(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Format ETA minutes into a display string */
export function formatEta(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes <= 1) return "Arriving!";
  return `${minutes} min`;
}

/** Format metres into a readable distance string */
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}
