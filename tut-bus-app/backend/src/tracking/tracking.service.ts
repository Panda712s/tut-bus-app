import { Injectable, Logger } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import {
  haversineMeters,
  distanceToPolylineMeters,
  LatLng,
} from '../common/geo/geo.util';

/** How far off the route polyline (metres) counts as a deviation. */
const DEVIATION_THRESHOLD_M = 150;
/** Consecutive off-route pings before an alert is raised (debounce GPS noise). */
const DEVIATION_STREAK = 3;
/** Re-arrival at the same stop is ignored for this long (ms). */
const ARRIVAL_COOLDOWN_MS = 120_000;

/**
 * Runs on every GPS ping for a bus that is on an active trip:
 *  - detects geofenced arrivals / departures at the route's stops and
 *    pushes an "arriving now" event to riders;
 *  - detects when the bus strays off its route polyline and raises /
 *    clears a RouteDeviationAlert for the admin fleet wall.
 *
 * Deviation streak counters are kept in memory - they are a debounce, not
 * a source of truth (the alert rows in the DB are).
 */
@Injectable()
export class TrackingService {
  private readonly logger = new Logger('TrackingService');
  private readonly deviationStreak = new Map<string, number>();

  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async processPing(busId: string, point: LatLng): Promise<void> {
    try {
      const trip = await this.prisma.trip.findFirst({
        where: { busId, status: { in: [TripStatus.IN_PROGRESS, TripStatus.PAUSED] } },
        include: { route: { include: { stops: { orderBy: { order: 'asc' } } } }, bus: true },
        orderBy: { startedAt: 'desc' },
      });
      if (!trip || trip.route.stops.length === 0) return;

      await this.detectStopArrival(trip, point);
      await this.detectDeviation(trip, point);
    } catch (err) {
      this.logger.warn(`processPing failed for bus ${busId}: ${(err as Error).message}`);
    }
  }

  // ----- Geofenced arrivals -----

  private async detectStopArrival(
    trip: { id: string; lastKnownStopId: string | null; routeId: string; bus: { busNumber: string }; route: { stops: { id: string; name: string; lat: number; lng: number; radiusMeters: number; order: number }[] } },
    point: LatLng,
  ) {
    let nearest: { id: string; name: string; order: number } | null = null;
    let nearestDist = Infinity;

    for (const stop of trip.route.stops) {
      const d = haversineMeters(point, { lat: stop.lat, lng: stop.lng });
      if (d <= stop.radiusMeters && d < nearestDist) {
        nearest = { id: stop.id, name: stop.name, order: stop.order };
        nearestDist = d;
      }
    }

    if (!nearest) return;
    if (trip.lastKnownStopId === nearest.id) return;

    // Debounce: skip if we logged an arrival at this stop very recently.
    const recent = await this.prisma.tripStopEvent.findFirst({
      where: {
        tripId: trip.id,
        stopId: nearest.id,
        type: 'ARRIVED',
        occurredAt: { gte: new Date(Date.now() - ARRIVAL_COOLDOWN_MS) },
      },
    });
    if (recent) return;

    // Mark the previous stop as departed, if we had one.
    if (trip.lastKnownStopId) {
      const prevArrived = await this.prisma.tripStopEvent.findFirst({
        where: { tripId: trip.id, stopId: trip.lastKnownStopId, type: 'ARRIVED' },
        orderBy: { occurredAt: 'desc' },
      });
      if (prevArrived) {
        await this.prisma.tripStopEvent.create({
          data: { tripId: trip.id, stopId: trip.lastKnownStopId, type: 'DEPARTED' },
        });
        this.gateway.broadcast('stop:departure', {
          tripId: trip.id,
          routeId: trip.routeId,
          stopId: trip.lastKnownStopId,
          busNumber: trip.bus.busNumber,
          at: new Date().toISOString(),
        });
      }
    }

    await this.prisma.$transaction([
      this.prisma.tripStopEvent.create({
        data: { tripId: trip.id, stopId: nearest.id, type: 'ARRIVED' },
      }),
      this.prisma.trip.update({ where: { id: trip.id }, data: { lastKnownStopId: nearest.id } }),
    ]);

    const payload = {
      tripId: trip.id,
      routeId: trip.routeId,
      stopId: nearest.id,
      stopName: nearest.name,
      busNumber: trip.bus.busNumber,
      at: new Date().toISOString(),
    };
    this.gateway.broadcast('stop:arrival', payload);
    this.gateway.notifyRole('STUDENT', 'stop:arrival', payload);
    this.logger.log(`Bus ${trip.bus.busNumber} arrived at ${nearest.name} (trip ${trip.id})`);
  }

  // ----- Off-route detection -----

  private async detectDeviation(
    trip: { id: string; busId: string; route: { stops: { lat: number; lng: number }[] } },
    point: LatLng,
  ) {
    const polyline: LatLng[] = trip.route.stops.map((s) => ({ lat: s.lat, lng: s.lng }));
    if (polyline.length < 2) return;

    const dist = distanceToPolylineMeters(point, polyline);
    const open = await this.prisma.routeDeviationAlert.findFirst({
      where: { tripId: trip.id, status: 'OPEN' },
    });

    if (dist > DEVIATION_THRESHOLD_M) {
      const streak = (this.deviationStreak.get(trip.id) ?? 0) + 1;
      this.deviationStreak.set(trip.id, streak);
      if (streak >= DEVIATION_STREAK && !open) {
        const alert = await this.prisma.routeDeviationAlert.create({
          data: {
            tripId: trip.id,
            busId: trip.busId,
            lat: point.lat,
            lng: point.lng,
            distanceMeters: Math.round(dist),
          },
        });
        const payload = {
          alertId: alert.id,
          tripId: trip.id,
          busId: trip.busId,
          distanceMeters: alert.distanceMeters,
          lat: point.lat,
          lng: point.lng,
          at: alert.createdAt.toISOString(),
        };
        this.gateway.notifyRole('ADMIN', 'ops:deviation', payload);
        this.gateway.broadcast('ops:deviation', payload);
        this.logger.warn(`Trip ${trip.id} off route by ${alert.distanceMeters}m - alert raised`);
      }
    } else {
      this.deviationStreak.set(trip.id, 0);
      if (open) {
        await this.prisma.routeDeviationAlert.update({
          where: { id: open.id },
          data: { status: 'CLEARED', clearedAt: new Date() },
        });
        this.gateway.notifyRole('ADMIN', 'ops:deviation-cleared', { alertId: open.id, tripId: trip.id });
        this.gateway.broadcast('ops:deviation-cleared', { alertId: open.id, tripId: trip.id });
      }
    }
  }
}
