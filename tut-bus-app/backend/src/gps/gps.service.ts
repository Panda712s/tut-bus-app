import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GpsUpdateDto } from './dto/gps-update.dto';

@Injectable()
export class GpsService {
  constructor(private prisma: PrismaService) {}

  /** Persists a GPS ping and updates the bus's live-location snapshot in one go. */
  async recordPing(dto: GpsUpdateDto) {
    const [, bus] = await this.prisma.$transaction([
      this.prisma.gpsLog.create({
        data: {
          busId: dto.busId,
          tripId: dto.tripId,
          lat: dto.lat,
          lng: dto.lng,
          speedKmh: dto.speedKmh,
          heading: dto.heading,
        },
      }),
      this.prisma.bus.update({
        where: { id: dto.busId },
        data: {
          currentLat: dto.lat,
          currentLng: dto.lng,
          speedKmh: dto.speedKmh,
          heading: dto.heading,
          lastLocationAt: new Date(),
        },
      }),
    ]);
    return bus;
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
