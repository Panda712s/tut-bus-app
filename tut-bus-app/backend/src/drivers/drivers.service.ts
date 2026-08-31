import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDriverDto) {
    const existing = await this.prisma.driver.findFirst({
      where: { OR: [{ email: dto.email }, { employeeNumber: dto.employeeNumber }, { licenseNumber: dto.licenseNumber }] },
    });
    if (existing) throw new ConflictException('A driver with this email, employee number, or license already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.driver.create({
      data: {
        employeeNumber: dto.employeeNumber,
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        licenseNumber: dto.licenseNumber,
        phone: dto.phone,
        assignedBusId: dto.assignedBusId,
      },
    });
  }

  async findAll() {
    return this.prisma.driver.findMany({
      select: {
        id: true, employeeNumber: true, fullName: true, email: true, phone: true,
        licenseNumber: true, status: true, isActive: true, assignedBusId: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      select: {
        id: true, employeeNumber: true, fullName: true, email: true, phone: true,
        licenseNumber: true, status: true, isActive: true, assignedBusId: true, createdAt: true,
      },
    });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: dto });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: { isActive: false } });
  }

  async reportIncident(driverId: string, dto: ReportIncidentDto) {
    return this.prisma.incidentReport.create({
      data: { driverId, type: dto.type, description: dto.description, tripId: dto.tripId },
    });
  }

  async myIncidentReports(driverId: string) {
    return this.prisma.incidentReport.findMany({ where: { driverId }, orderBy: { createdAt: 'desc' } });
  }
}
