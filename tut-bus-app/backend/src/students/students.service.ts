import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.student.findMany({
      select: {
        id: true, studentNumber: true, fullName: true, email: true, phone: true,
        isActive: true, emailVerified: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true, studentNumber: true, fullName: true, email: true, phone: true,
        profileImageUrl: true, isActive: true, emailVerified: true, createdAt: true,
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, dto: UpdateStudentDto) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.student.update({ where: { id }, data: { isActive: false } });
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

  async ensureSelfOrAdmin(requesterId: string, requesterRole: string, targetId: string) {
    if (requesterRole === 'ADMIN') return;
    if (requesterId !== targetId) throw new ForbiddenException('You may only access your own data');
  }
}
