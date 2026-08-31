/**
 * Small geo helpers for stop geofencing, ETA estimation and off-route
 * detection. All distances are in metres. For the short spans involved
 * (a campus route) an equirectangular approximation is accurate enough
 * and far cheaper than repeated haversine calls.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_M = 6_371_000;
const DEG_TO_RAD = Math.PI / 180;

/** Great-circle distance between two points, in metres. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLng = (b.lng - a.lng) * DEG_TO_RAD;
  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Project lat/lng to local planar metres around an origin (equirectangular). */
function toLocalXY(p: LatLng, origin: LatLng): { x: number; y: number } {
  const x = (p.lng - origin.lng) * DEG_TO_RAD * Math.cos(origin.lat * DEG_TO_RAD) * EARTH_RADIUS_M;
  const y = (p.lat - origin.lat) * DEG_TO_RAD * EARTH_RADIUS_M;
  return { x, y };
}

/** Shortest distance (metres) from a point to the segment a-b. */
export function pointToSegmentMeters(p: LatLng, a: LatLng, b: LatLng): number {
  const origin = a;
  const pp = toLocalXY(p, origin);
  const pa = { x: 0, y: 0 };
  const pb = toLocalXY(b, origin);

  const abx = pb.x - pa.x;
  const aby = pb.y - pa.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq === 0) return Math.hypot(pp.x, pp.y);

  let t = (pp.x * abx + pp.y * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = pa.x + t * abx;
  const cy = pa.y + t * aby;
  return Math.hypot(pp.x - cx, pp.y - cy);
}

/**
 * Shortest distance (metres) from a point to a polyline (ordered list of
 * points). Returns Infinity for a polyline with fewer than two points.
 */
export function distanceToPolylineMeters(p: LatLng, polyline: LatLng[]): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) return haversineMeters(p, polyline[0]);
  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentMeters(p, polyline[i], polyline[i + 1]);
    if (d < min) min = d;
  }
  return min;
}

/**
 * Index of the polyline vertex the point has most likely just passed
 * (nearest segment's start vertex). Used to work out which stops are
 * still ahead of the bus.
 */
export function nearestSegmentIndex(p: LatLng, polyline: LatLng[]): number {
  let min = Infinity;
  let idx = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = pointToSegmentMeters(p, polyline[i], polyline[i + 1]);
    if (d < min) {
      min = d;
      idx = i;
    }
  }
  return idx;
}

/** Total length (metres) of a polyline. */
export function polylineLengthMeters(polyline: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    total += haversineMeters(polyline[i], polyline[i + 1]);
  }
  return total;
}
