import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingService } from '../tracking/tracking.service';
import { GpsUpdateDto } from './dto/gps-update.dto';

@Injectable()
export class GpsService {
  constructor(
    private prisma: PrismaService,
    private tracking: TrackingService,
  ) {}

  /** Persists a GPS ping and updates the bus's live-location snapshot in one go. */
  async recordPing(dto: GpsUpdateDto) {
    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    const [, bus] = await this.prisma.$transaction([
      this.prisma.gpsLog.create({
        data: {
          busId: dto.busId,
          tripId: dto.tripId,
          lat: dto.lat,
          lng: dto.lng,
          speedKmh: dto.speedKmh,
          heading: dto.heading,
          recordedAt,
        },
      }),
      this.prisma.bus.update({
        where: { id: dto.busId },
        data: {
          currentLat: dto.lat,
          currentLng: dto.lng,
          speedKmh: dto.speedKmh,
          heading: dto.heading,
          lastLocationAt: recordedAt,
        },
      }),
    ]);

    await this.tracking.processPing(bus.id, { lat: dto.lat, lng: dto.lng });
    return bus;
  }

  /**
   * Flush a batch of pings buffered by the driver app while it was offline.
   * Pings are processed oldest-first so the bus snapshot ends on the newest
   * fix; each is expected to carry its own `recordedAt`.
   */
  async recordPingBatch(pings: GpsUpdateDto[]) {
    const ordered = [...pings].sort((a, b) => {
      const ta = a.recordedAt ? Date.parse(a.recordedAt) : 0;
      const tb = b.recordedAt ? Date.parse(b.recordedAt) : 0;
      return ta - tb;
    });

    let accepted = 0;
    for (const ping of ordered) {
      await this.recordPing(ping);
      accepted += 1;
    }
    return { accepted };
  }

  async recentLogsForBus(busId: string, limit = 50) {
    return this.prisma.gpsLog.findMany({
      where: { busId },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async logsForTrip(tripId: string) {
    return this.prisma.gpsLog.findMany({ where: { tripId }, orderBy: { recordedAt: 'asc' } });
  }
}
