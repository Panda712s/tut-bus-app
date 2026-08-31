import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviationStatus, TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const STALE_FIX_MS = 90_000;

@Injectable()
export class OpsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  /** One call that powers the admin "live fleet wall". */
  async fleet() {
    const now = Date.now();

    const [activeTrips, openDeviations, activeSos] = await Promise.all([
      this.prisma.trip.findMany({
        where: { status: { in: [TripStatus.IN_PROGRESS, TripStatus.PAUSED] } },
        include: {
          bus: true,
          route: { select: { id: true, name: true } },
          driver: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { startedAt: 'asc' },
      }),
      this.prisma.routeDeviationAlert.findMany({
        where: { status: DeviationStatus.OPEN },
        select: { id: true, tripId: true, busId: true, distanceMeters: true, createdAt: true },
      }),
      this.prisma.sosAlert.count({ where: { status: { in: ['ACTIVE', 'ACKNOWLEDGED'] } } }),
    ]);

    const deviationByTrip = new Map(openDeviations.map((d) => [d.tripId, d]));

    const buses = activeTrips.map((trip) => {
      const fixAgeMs = trip.bus.lastLocationAt ? now - trip.bus.lastLocationAt.getTime() : null;
      const deviation = deviationByTrip.get(trip.id) ?? null;
      return {
        tripId: trip.id,
        tripStatus: trip.status,
        startedAt: trip.startedAt,
        bus: {
          id: trip.bus.id,
          busNumber: trip.bus.busNumber,
          plateNumber: trip.bus.plateNumber,
          lat: trip.bus.currentLat,
          lng: trip.bus.currentLng,
          speedKmh: trip.bus.speedKmh,
          heading: trip.bus.heading,
          capacity: trip.bus.capacity,
          passengerCount: trip.bus.passengerCount,
          capacityState: trip.bus.capacityState,
        },
        route: trip.route,
        driver: trip.driver,
        fixAgeSeconds: fixAgeMs === null ? null : Math.round(fixAgeMs / 1000),
        gpsStale: fixAgeMs === null ? true : fixAgeMs > STALE_FIX_MS,
        offRoute: deviation
          ? { alertId: deviation.id, distanceMeters: deviation.distanceMeters, since: deviation.createdAt }
          : null,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      activeTripCount: buses.length,
      openDeviationCount: openDeviations.length,
      activeSosCount: activeSos,
      gpsStaleCount: buses.filter((b) => b.gpsStale).length,
      buses,
    };
  }

  deviationAlerts(status?: DeviationStatus) {
    return this.prisma.routeDeviationAlert.findMany({
      where: status ? { status } : undefined,
      include: {
        bus: { select: { busNumber: true } },
        trip: { select: { id: true, driver: { select: { fullName: true } }, route: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async clearDeviation(id: string) {
    const alert = await this.prisma.routeDeviationAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Deviation alert not found');
    const updated = await this.prisma.routeDeviationAlert.update({
      where: { id },
      data: { status: DeviationStatus.CLEARED, clearedAt: new Date() },
    });
    this.gateway.notifyRole('ADMIN', 'ops:deviation-cleared', { alertId: id, tripId: alert.tripId });
    return updated;
  }
}
