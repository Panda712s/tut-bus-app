import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SosStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EtaService } from '../eta/eta.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RaiseSosDto } from './dto/raise-sos.dto';
import { CreateTripShareDto } from './dto/create-trip-share.dto';

const DEFAULT_SHARE_HOURS = 2;

@Injectable()
export class SafetyService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private eta: EtaService,
  ) {}

  // ----- SOS -----

  async raiseSos(user: AuthenticatedUser, dto: RaiseSosDto) {
    const alert = await this.prisma.sosAlert.create({
      data: {
        lat: dto.lat,
        lng: dto.lng,
        note: dto.note,
        tripId: dto.tripId,
        raisedByStudentId: user.role === 'STUDENT' ? user.id : undefined,
        raisedByDriverId: user.role === 'DRIVER' ? user.id : undefined,
      },
      include: this.sosInclude(),
    });

    const payload = this.toSosPayload(alert);
    this.gateway.notifyRole('ADMIN', 'sos:new', payload);
    this.gateway.broadcast('sos:new', payload);
    return payload;
  }

  listSos(status?: SosStatus) {
    return this.prisma.sosAlert
      .findMany({
        where: status ? { status } : undefined,
        include: this.sosInclude(),
        orderBy: { createdAt: 'desc' },
        take: 200,
      })
      .then((rows) => rows.map((r) => this.toSosPayload(r)));
  }

  async acknowledgeSos(id: string) {
    await this.getSosOrThrow(id);
    const updated = await this.prisma.sosAlert.update({
      where: { id },
      data: { status: SosStatus.ACKNOWLEDGED, acknowledgedAt: new Date() },
      include: this.sosInclude(),
    });
    const payload = this.toSosPayload(updated);
    this.gateway.notifyRole('ADMIN', 'sos:updated', payload);
    return payload;
  }

  async resolveSos(id: string) {
    await this.getSosOrThrow(id);
    const updated = await this.prisma.sosAlert.update({
      where: { id },
      data: { status: SosStatus.RESOLVED, resolvedAt: new Date() },
      include: this.sosInclude(),
    });
    const payload = this.toSosPayload(updated);
    this.gateway.notifyRole('ADMIN', 'sos:updated', payload);
    return payload;
  }

  private async getSosOrThrow(id: string) {
    const alert = await this.prisma.sosAlert.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('SOS alert not found');
    return alert;
  }

  private sosInclude() {
    return {
      raisedByStudent: { select: { id: true, fullName: true, studentNumber: true, phone: true } },
      raisedByDriver: { select: { id: true, fullName: true, employeeNumber: true, phone: true } },
      trip: { select: { id: true, status: true, bus: { select: { busNumber: true } }, route: { select: { name: true } } } },
    } as const;
  }

  private toSosPayload(a: any) {
    return {
      id: a.id,
      status: a.status,
      lat: a.lat,
      lng: a.lng,
      note: a.note,
      createdAt: a.createdAt,
      acknowledgedAt: a.acknowledgedAt,
      resolvedAt: a.resolvedAt,
      raisedBy: a.raisedByStudent
        ? { kind: 'STUDENT', name: a.raisedByStudent.fullName, ref: a.raisedByStudent.studentNumber, phone: a.raisedByStudent.phone }
        : a.raisedByDriver
          ? { kind: 'DRIVER', name: a.raisedByDriver.fullName, ref: a.raisedByDriver.employeeNumber, phone: a.raisedByDriver.phone }
          : { kind: 'UNKNOWN', name: null, ref: null, phone: null },
      trip: a.trip
        ? { id: a.trip.id, status: a.trip.status, busNumber: a.trip.bus?.busNumber ?? null, routeName: a.trip.route?.name ?? null }
        : null,
    };
  }

  // ----- Trip sharing -----

  async createShare(user: AuthenticatedUser, dto: CreateTripShareDto) {
    const trip = await this.prisma.trip.findUnique({ where: { id: dto.tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    const hours = dto.hours ?? DEFAULT_SHARE_HOURS;
    const token = (randomUUID() + randomUUID()).replace(/-/g, '');
    const expiresAt = new Date(Date.now() + hours * 3600_000);

    const share = await this.prisma.tripShare.create({
      data: {
        token,
        tripId: dto.tripId,
        expiresAt,
        createdByStudentId: user.role === 'STUDENT' ? user.id : undefined,
      },
    });

    return { id: share.id, token: share.token, path: `/s/${share.token}`, expiresAt: share.expiresAt };
  }

  async listMyShares(user: AuthenticatedUser) {
    return this.prisma.tripShare.findMany({
      where: { createdByStudentId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async revokeShare(user: AuthenticatedUser, id: string) {
    const share = await this.prisma.tripShare.findUnique({ where: { id } });
    if (!share) throw new NotFoundException('Share not found');
    if (share.createdByStudentId && share.createdByStudentId !== user.id) {
      throw new ForbiddenException('This is not your share link');
    }
    return this.prisma.tripShare.update({ where: { id }, data: { revoked: true } });
  }

  /** Public: resolve a share token to a live trip snapshot. */
  async resolveShare(token: string) {
    const share = await this.prisma.tripShare.findUnique({
      where: { token },
      include: {
        trip: {
          include: {
            bus: { select: { id: true, busNumber: true, currentLat: true, currentLng: true, capacityState: true, lastLocationAt: true } },
            route: { select: { id: true, name: true, origin: true, destination: true } },
          },
        },
      },
    });
    if (!share || share.revoked) throw new NotFoundException('This share link is no longer active');
    if (share.expiresAt.getTime() < Date.now()) throw new BadRequestException('This share link has expired');

    const { trip } = share;
    let finalStopEta: { etaSeconds: number; etaAt: string } | null = null;
    try {
      const busEtas = await this.eta.forRoute(trip.route.id);
      const mine = busEtas.find((b) => b.busId === trip.bus.id);
      const last = mine?.stops[mine.stops.length - 1];
      if (last) finalStopEta = { etaSeconds: last.etaSeconds, etaAt: last.etaAt };
    } catch {
      /* ETA is best-effort */
    }

    return {
      trip: { id: trip.id, status: trip.status, startedAt: trip.startedAt },
      route: trip.route,
      bus: {
        busNumber: trip.bus.busNumber,
        lat: trip.bus.currentLat,
        lng: trip.bus.currentLng,
        capacityState: trip.bus.capacityState,
        lastLocationAt: trip.bus.lastLocationAt,
      },
      finalStopEta,
      expiresAt: share.expiresAt,
    };
  }
}
