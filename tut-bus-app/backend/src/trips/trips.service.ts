import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { CreateTripDto } from './dto/create-trip.dto';

@Injectable()
export class TripsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
  ) {}

  async findOne(id: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: { bus: true, route: true, driver: { select: { id: true, fullName: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async findAll(filters: { driverId?: string; busId?: string; status?: TripStatus }) {
    return this.prisma.trip.findMany({
      where: filters,
      include: { bus: true, route: true, driver: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async start(driverId: string, dto: CreateTripDto) {
    const activeTrip = await this.prisma.trip.findFirst({
      where: { driverId, status: { in: [TripStatus.IN_PROGRESS, TripStatus.PAUSED] } },
    });
    if (activeTrip) throw new BadRequestException('You already have an active trip. End it before starting a new one.');

    const trip = await this.prisma.trip.create({
      data: { busId: dto.busId, routeId: dto.routeId, driverId, status: TripStatus.IN_PROGRESS, startedAt: new Date() },
      include: { bus: true, route: true },
    });

    await this.prisma.bus.update({
      where: { id: dto.busId },
      data: { status: 'ACTIVE', currentRouteId: dto.routeId },
    });
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } });

    this.gateway.notifyRole('STUDENT', 'trip:started', { tripId: trip.id, busId: trip.busId, routeId: trip.routeId });
    return trip;
  }

  async pause(driverId: string, tripId: string) {
    const trip = await this.assertOwnedActiveTrip(driverId, tripId, [TripStatus.IN_PROGRESS]);
    return this.prisma.trip.update({ where: { id: trip.id }, data: { status: TripStatus.PAUSED } });
  }

  async resume(driverId: string, tripId: string) {
    const trip = await this.assertOwnedActiveTrip(driverId, tripId, [TripStatus.PAUSED]);
    return this.prisma.trip.update({ where: { id: trip.id }, data: { status: TripStatus.IN_PROGRESS } });
  }

  async end(driverId: string, tripId: string) {
    const trip = await this.assertOwnedActiveTrip(driverId, tripId, [TripStatus.IN_PROGRESS, TripStatus.PAUSED]);
    const updated = await this.prisma.trip.update({
      where: { id: trip.id },
      data: { status: TripStatus.COMPLETED, endedAt: new Date() },
    });
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ACTIVE' } });
    this.gateway.notifyRole('STUDENT', 'trip:ended', { tripId: trip.id, busId: trip.busId });
    return updated;
  }

  async cancel(driverId: string, tripId: string) {
    const trip = await this.assertOwnedActiveTrip(driverId, tripId, [
      TripStatus.SCHEDULED,
      TripStatus.IN_PROGRESS,
      TripStatus.PAUSED,
    ]);
    await this.prisma.driver.update({ where: { id: driverId }, data: { status: 'ACTIVE' } });
    return this.prisma.trip.update({ where: { id: trip.id }, data: { status: TripStatus.CANCELLED, endedAt: new Date() } });
  }

  // ----- Student boarding (QR Code Boarding feature) -----

  async board(studentId: string, tripId: string, qrScanned: boolean) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.status !== TripStatus.IN_PROGRESS) {
      throw new BadRequestException('This trip is not currently in progress');
    }

    const existing = await this.prisma.tripHistory.findFirst({
      where: { studentId, tripId, alightedAt: null },
    });
    if (existing) return existing;

    const [history] = await this.prisma.$transaction([
      this.prisma.tripHistory.create({ data: { studentId, tripId, qrScanned } }),
      this.prisma.trip.update({ where: { id: tripId }, data: { passengerCount: { increment: 1 } } }),
      this.prisma.bus.update({ where: { id: trip.busId }, data: { passengerCount: { increment: 1 } } }),
    ]);
    return history;
  }

  async alight(studentId: string, tripId: string) {
    const history = await this.prisma.tripHistory.findFirst({
      where: { studentId, tripId, alightedAt: null },
      orderBy: { boardedAt: 'desc' },
    });
    if (!history) throw new NotFoundException('No active boarding found for this trip');

    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    const [updated] = await this.prisma.$transaction([
      this.prisma.tripHistory.update({ where: { id: history.id }, data: { alightedAt: new Date() } }),
      this.prisma.trip.update({ where: { id: tripId }, data: { passengerCount: { decrement: 1 } } }),
      ...(trip ? [this.prisma.bus.update({ where: { id: trip.busId }, data: { passengerCount: { decrement: 1 } } })] : []),
    ]);
    return updated;
  }

  private async assertOwnedActiveTrip(driverId: string, tripId: string, allowedStatuses: TripStatus[]) {
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.driverId !== driverId) throw new ForbiddenException('This is not your trip');
    if (!allowedStatuses.includes(trip.status)) {
      throw new BadRequestException(`Trip is not in a valid state for this action (current status: ${trip.status})`);
    }
    return trip;
  }
}
