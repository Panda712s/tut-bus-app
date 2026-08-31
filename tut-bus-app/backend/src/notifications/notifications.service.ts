import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationsGateway,
    private fcm: FcmService,
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

    await this.fcm.send([], notification.title, notification.body);

    return notification;
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
