import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private fcm: FcmService,
    private auditLog: AuditLogService,
  ) {}

  async create(dto: CreateNotificationDto, sentById?: string) {
    const notification = await this.prisma.notification.create({
      data: {
        title: dto.title,
        body: dto.body,
        type: dto.type,
        audience: dto.audience,
        routeId: dto.routeId,
        sentById,
      },
    });

    const recipientIds = await this.resolveRecipients(dto);

    if (recipientIds.studentIds.length) {
      await this.prisma.notificationRecipient.createMany({
        data: recipientIds.studentIds.map((studentId) => ({ notificationId: notification.id, studentId })),
      });
    }
    if (recipientIds.driverIds.length) {
      await this.prisma.notificationRecipient.createMany({
        data: recipientIds.driverIds.map((driverId) => ({ notificationId: notification.id, driverId })),
      });
    }

    const payload = { id: notification.id, title: notification.title, body: notification.body, type: notification.type, createdAt: notification.createdAt };
    if (dto.audience === 'ALL_STUDENTS') this.gateway.notifyRole('STUDENT', 'notification:new', payload);
    else if (dto.audience === 'ALL_DRIVERS') this.gateway.notifyRole('DRIVER', 'notification:new', payload);
    else {
      for (const id of [...recipientIds.studentIds, ...recipientIds.driverIds]) {
        this.gateway.notifyUser(id, 'notification:new', payload);
      }
    }

    const deviceTokens = await this.deviceTokensFor(recipientIds.studentIds, recipientIds.driverIds);
    if (deviceTokens.length) {
      await this.fcm.send(deviceTokens, notification.title, notification.body, {
        type: notification.type,
        notificationId: notification.id,
      });
    }

    // Only log when an admin actually sent this (sentById set) - system-
    // triggered notifications (e.g. the automatic "Bus on the way" push from
    // trips.service) are not admin actions.
    if (sentById) {
      this.auditLog
        .log(
          { id: sentById },
          'notification.send',
          'Notification',
          notification.id,
          `Sent notification "${notification.title}" to ${dto.audience.replace(/_/g, ' ').toLowerCase()}`,
        )
        .catch(() => undefined);
    }

    return notification;
  }

  /** Upserts a device's push token, tied to whichever role is signed in.
   * Re-registering the same token (e.g. every app launch) just refreshes it. */
  async registerDeviceToken(user: AuthenticatedUser, dto: RegisterDeviceTokenDto) {
    await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      create: {
        token: dto.token,
        platform: dto.platform,
        studentId: user.role === Role.STUDENT ? user.id : undefined,
        driverId: user.role === Role.DRIVER ? user.id : undefined,
      },
      update: {
        platform: dto.platform,
        studentId: user.role === Role.STUDENT ? user.id : null,
        driverId: user.role === Role.DRIVER ? user.id : null,
      },
    });
    return { success: true };
  }

  async unregisterDeviceToken(token: string) {
    await this.prisma.deviceToken.deleteMany({ where: { token } });
    return { success: true };
  }

  private async deviceTokensFor(studentIds: string[], driverIds: string[]): Promise<string[]> {
    if (!studentIds.length && !driverIds.length) return [];
    const rows = await this.prisma.deviceToken.findMany({
      where: { OR: [{ studentId: { in: studentIds } }, { driverId: { in: driverIds } }] },
      select: { token: true },
    });
    return rows.map((r) => r.token);
  }

  private async resolveRecipients(dto: CreateNotificationDto) {
    if (dto.audience === 'SINGLE_STUDENT' && dto.targetStudentId) {
      return { studentIds: [dto.targetStudentId], driverIds: [] };
    }
    if (dto.audience === 'SINGLE_DRIVER' && dto.targetDriverId) {
      return { studentIds: [], driverIds: [dto.targetDriverId] };
    }
    if (dto.audience === 'ALL_STUDENTS') {
      const students = await this.prisma.student.findMany({ where: { isActive: true }, select: { id: true } });
      return { studentIds: students.map((s) => s.id), driverIds: [] };
    }
    if (dto.audience === 'ALL_DRIVERS') {
      const drivers = await this.prisma.driver.findMany({ where: { isActive: true }, select: { id: true } });
      return { studentIds: [], driverIds: drivers.map((d) => d.id) };
    }
    if (dto.audience === 'ROUTE_STUDENTS' && dto.routeId) {
      const favourites = await this.prisma.favouriteRoute.findMany({
        where: { routeId: dto.routeId },
        select: { studentId: true },
      });
      return { studentIds: favourites.map((f) => f.studentId), driverIds: [] };
    }
    return { studentIds: [], driverIds: [] };
  }

  findForUser(user: AuthenticatedUser) {
    if (user.role === Role.DRIVER) return this.findForDriver(user.id);
    return this.findForStudent(user.id);
  }

  async findForStudent(studentId: string) {
    return this.prisma.notificationRecipient.findMany({
      where: { studentId },
      include: { notification: true },
      orderBy: { notification: { createdAt: 'desc' } },
    });
  }

  async findForDriver(driverId: string) {
    return this.prisma.notificationRecipient.findMany({
      where: { driverId },
      include: { notification: true },
      orderBy: { notification: { createdAt: 'desc' } },
    });
  }

  async markRead(recipientId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({ where: { id: recipientId } });
    if (!recipient) throw new NotFoundException('Notification not found');
    return this.prisma.notificationRecipient.update({
      where: { id: recipientId },
      data: { read: true, readAt: new Date() },
    });
  }

  async findAll() {
    return this.prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }
}
