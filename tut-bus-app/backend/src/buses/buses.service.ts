import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BusCapacityState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Injectable()
export class BusesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBusDto) {
    const existing = await this.prisma.bus.findFirst({
      where: { OR: [{ busNumber: dto.busNumber }, { plateNumber: dto.plateNumber }] },
    });
    if (existing) throw new ConflictException('A bus with this number or plate already exists');
    return this.prisma.bus.create({ data: dto });
  }

  async findAll() {
    return this.prisma.bus.findMany({
      include: { currentRoute: true, currentDriver: { select: { id: true, fullName: true } } },
      orderBy: { busNumber: 'asc' },
    });
  }

  async findOne(id: string) {
    const bus = await this.prisma.bus.findUnique({
      where: { id },
      include: { currentRoute: { include: { stops: true } }, currentDriver: true },
    });
    if (!bus) throw new NotFoundException('Bus not found');
    return bus;
  }

  async update(id: string, dto: UpdateBusDto) {
    await this.findOne(id);
    return this.prisma.bus.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.bus.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  /** All buses currently assigned to a route, with their live GPS snapshot - powers the live map. */
  async liveBusesForRoute(routeId: string) {
    return this.prisma.bus.findMany({
      where: { currentRouteId: routeId, status: 'ACTIVE' },
      select: {
        id: true, busNumber: true, currentLat: true, currentLng: true, heading: true,
        speedKmh: true, lastLocationAt: true, capacityState: true, passengerCount: true, capacity: true,
      },
    });
  }

  async liveBusesAll() {
    return this.prisma.bus.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true, busNumber: true, currentLat: true, currentLng: true, heading: true,
        speedKmh: true, lastLocationAt: true, capacityState: true, passengerCount: true, capacity: true,
        currentRouteId: true,
      },
    });
  }

  static capacityStateFor(passengerCount: number, capacity: number): BusCapacityState {
    const ratio = capacity > 0 ? passengerCount / capacity : 0;
    if (ratio >= 0.9) return BusCapacityState.FULL;
    if (ratio >= 0.4) return BusCapacityState.MODERATE;
    return BusCapacityState.EMPTY;
  }

  async updatePassengerCount(id: string, passengerCount: number) {
    const bus = await this.findOne(id);
    const capacityState = BusesService.capacityStateFor(passengerCount, bus.capacity);
    return this.prisma.bus.update({ where: { id }, data: { passengerCount, capacityState } });
  }
}
