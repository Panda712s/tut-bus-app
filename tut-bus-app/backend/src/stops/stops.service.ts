import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';

@Injectable()
export class StopsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateStopDto) {
    return this.prisma.busStop.create({ data: dto });
  }

  findForRoute(routeId: string) {
    return this.prisma.busStop.findMany({ where: { routeId }, orderBy: { order: 'asc' } });
  }

  async findOne(id: string) {
    const stop = await this.prisma.busStop.findUnique({ where: { id } });
    if (!stop) throw new NotFoundException('Bus stop not found');
    return stop;
  }

  async update(id: string, dto: UpdateStopDto) {
    await this.findOne(id);
    return this.prisma.busStop.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.busStop.delete({ where: { id } });
  }
}
