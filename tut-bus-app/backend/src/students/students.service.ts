import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { UpdateStudentDto } from './dto/update-student.dto';

const STUDENT_SELECT = {
  id: true, studentNumber: true, fullName: true, email: true, phone: true,
  profileImageUrl: true, isActive: true, emailVerified: true, createdAt: true,
};

@Injectable()
export class StudentsService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async findAll() {
    return this.prisma.student.findMany({
      select: STUDENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id }, select: STUDENT_SELECT });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto, adminId?: string) {
    await this.findOne(id);
    const student = await this.prisma.student.update({ where: { id }, data: dto, select: STUDENT_SELECT });

    // Only log when an admin drove this update (adminId set) - a student
    // updating their own profile via updateMe is not an admin action.
    if (adminId) {
      this.auditLog
        .log({ id: adminId }, 'student.update', 'Student', student.id, `Updated student ${student.fullName} (${student.studentNumber})`)
        .catch(() => undefined);
    }

    return student;
  }

  async deactivate(id: string, adminId?: string) {
    await this.findOne(id);
    const student = await this.prisma.student.update({ where: { id }, data: { isActive: false }, select: STUDENT_SELECT });

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'student.deactivate',
        'Student',
        student.id,
        `Deactivated student ${student.fullName} (${student.studentNumber})`,
      )
      .catch(() => undefined);

    return student;
  }

  async activate(id: string, adminId?: string) {
    await this.findOne(id);
    const student = await this.prisma.student.update({ where: { id }, data: { isActive: true }, select: STUDENT_SELECT });

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'student.activate',
        'Student',
        student.id,
        `Activated student ${student.fullName} (${student.studentNumber})`,
      )
      .catch(() => undefined);

    return student;
  }

  async addFavouriteRoute(studentId: string, routeId: string) {
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) throw new NotFoundException('Route not found');
    return this.prisma.favouriteRoute.upsert({
      where: { studentId_routeId: { studentId, routeId } },
      update: {},
      create: { studentId, routeId },
    });
  }

  async removeFavouriteRoute(studentId: string, routeId: string) {
    await this.prisma.favouriteRoute
      .delete({ where: { studentId_routeId: { studentId, routeId } } })
      .catch(() => undefined);
    return { message: 'Removed from favourites' };
  }

  async listFavouriteRoutes(studentId: string) {
    return this.prisma.favouriteRoute.findMany({ where: { studentId }, include: { route: true } });
  }

  async addFavouriteStop(studentId: string, stopId: string) {
    const stop = await this.prisma.busStop.findUnique({ where: { id: stopId } });
    if (!stop) throw new NotFoundException('Bus stop not found');
    return this.prisma.favouriteStop.upsert({
      where: { studentId_stopId: { studentId, stopId } },
      update: {},
      create: { studentId, stopId },
    });
  }

  async removeFavouriteStop(studentId: string, stopId: string) {
    await this.prisma.favouriteStop
      .delete({ where: { studentId_stopId: { studentId, stopId } } })
      .catch(() => undefined);
    return { message: 'Removed from favourites' };
  }

  async tripHistory(studentId: string) {
    return this.prisma.tripHistory.findMany({
      where: { studentId },
      include: { trip: { include: { bus: true, route: true } } },
      orderBy: { boardedAt: 'desc' },
    });
  }

  async myStats(studentId: string) {
    const completedTrips = await this.prisma.tripHistory.findMany({
      where: { studentId, alightedAt: { not: null } },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let totalMinutesRiding = 0;
    let tripsThisMonth = 0;

    for (const trip of completedTrips) {
      if (trip.boardedAt >= startOfMonth) tripsThisMonth += 1;
      const alightedAt = trip.alightedAt as Date;
      totalMinutesRiding += (alightedAt.getTime() - trip.boardedAt.getTime()) / 60000;
    }

    return {
      totalTrips: completedTrips.length,
      tripsThisMonth,
      totalMinutesRiding: Math.round(totalMinutesRiding),
    };
  }

  async ensureSelfOrAdmin(requesterId: string, requesterRole: string, targetId: string) {
    if (requesterRole === 'ADMIN') return;
    if (requesterId !== targetId) throw new ForbiddenException('You may only access your own data');
  }
}
