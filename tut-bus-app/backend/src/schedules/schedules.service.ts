import { Injectable, NotFoundException } from '@nestjs/common';
import { DayType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateScheduleDto) {
    return this.prisma.schedule.create({ data: dto });
  }

  findForRoute(routeId: string, dayType?: DayType) {
    return this.prisma.schedule.findMany({
      where: { routeId, isActive: true, dayType },
      orderBy: [{ dayType: 'asc' }, { departureTime: 'asc' }],
    });
  }

  async findOne(id: string) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);
    return this.prisma.schedule.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.schedule.update({ where: { id }, data: { isActive: false } });
  }
}
