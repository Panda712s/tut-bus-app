import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  haversineMeters,
  nearestSegmentIndex,
  LatLng,
} from '../common/geo/geo.util';

/** Buses older than this (ms) are treated as having no live fix. */
const STALE_FIX_MS = 90_000;
/** Fallback average speed when the bus reports 0 / no speed (km/h). */
const FALLBACK_SPEED_KMH = 18;
const MIN_SPEED_KMH = 8;
const MAX_SPEED_KMH = 60;

export interface StopEta {
  stopId: string;
  stopName: string;
  order: number;
  distanceMeters: number;
  etaSeconds: number;
  etaAt: string; // ISO
}

export interface BusEta {
  busId: string;
  busNumber: string;
  routeId: string;
  lat: number;
  lng: number;
  speedKmh: number | null;
  capacityState: string;
  passengerCount: number;
  fixAgeSeconds: number;
  stops: StopEta[];
}

@Injectable()
export class EtaService {
  constructor(private prisma: PrismaService) {}

  /** ETA for every live bus on a route to each of its remaining stops. */
  async forRoute(routeId: string): Promise<BusEta[]> {
    const route = await this.prisma.route.findUnique({
      where: { id: routeId },
      include: { stops: { orderBy: { order: 'asc' } } },
    });
    if (!route) throw new NotFoundException('Route not found');
    if (route.stops.length < 2) return [];

    const buses = await this.prisma.bus.findMany({
      where: { currentRouteId: routeId, status: 'ACTIVE', currentLat: { not: null }, currentLng: { not: null } },
    });

    const now = Date.now();
    const polyline: LatLng[] = route.stops.map((s) => ({ lat: s.lat, lng: s.lng }));

    return buses
      .map((bus) => {
        const fixAge = bus.lastLocationAt ? now - bus.lastLocationAt.getTime() : Infinity;
        if (fixAge > STALE_FIX_MS) return null;

        const busPoint: LatLng = { lat: bus.currentLat!, lng: bus.currentLng! };
        const segIdx = nearestSegmentIndex(busPoint, polyline);

        const speedKmh = clamp(
          bus.speedKmh && bus.speedKmh > 1 ? bus.speedKmh : FALLBACK_SPEED_KMH,
          MIN_SPEED_KMH,
          MAX_SPEED_KMH,
        );
        const speedMps = (speedKmh * 1000) / 3600;

        // Distance from the bus to the end of its current segment, then along
        // the polyline vertex-by-vertex to each stop ahead of it.
        let running = haversineMeters(busPoint, polyline[segIdx + 1]);
        const stops: StopEta[] = [];
        for (let i = segIdx + 1; i < route.stops.length; i++) {
          if (i > segIdx + 1) {
            running += haversineMeters(polyline[i - 1], polyline[i]);
          }
          const stop = route.stops[i];
          const etaSeconds = Math.round(running / speedMps);
          stops.push({
            stopId: stop.id,
            stopName: stop.name,
            order: stop.order,
            distanceMeters: Math.round(running),
            etaSeconds,
            etaAt: new Date(now + etaSeconds * 1000).toISOString(),
          });
        }

        return {
          busId: bus.id,
          busNumber: bus.busNumber,
          routeId,
          lat: bus.currentLat!,
          lng: bus.currentLng!,
          speedKmh: bus.speedKmh ?? null,
          capacityState: bus.capacityState,
          passengerCount: bus.passengerCount,
          fixAgeSeconds: Math.round(fixAge / 1000),
          stops,
        } as BusEta;
      })
      .filter((x): x is BusEta => x !== null);
  }

  /** Next arrivals at a single stop, soonest first. */
  async forStop(stopId: string) {
    const stop = await this.prisma.busStop.findUnique({ where: { id: stopId } });
    if (!stop) throw new NotFoundException('Stop not found');

    const busEtas = await this.forRoute(stop.routeId);
    const arrivals = busEtas
      .map((b) => {
        const match = b.stops.find((s) => s.stopId === stopId);
        if (!match) return null;
        return {
          busId: b.busId,
          busNumber: b.busNumber,
          capacityState: b.capacityState,
          passengerCount: b.passengerCount,
          distanceMeters: match.distanceMeters,
          etaSeconds: match.etaSeconds,
          etaAt: match.etaAt,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.etaSeconds - b.etaSeconds);

    return { stopId, stopName: stop.name, routeId: stop.routeId, arrivals };
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
