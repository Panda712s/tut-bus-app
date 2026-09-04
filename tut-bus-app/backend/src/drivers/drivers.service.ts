import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';

const DRIVER_SELECT = {
  id: true, employeeNumber: true, fullName: true, email: true, phone: true,
  licenseNumber: true, profileImageUrl: true, status: true, isActive: true, assignedBusId: true, createdAt: true,
};

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  // Passwords are one-way hashed and never stored or returned in plaintext.
  // The only place a driver's password is ever visible is the single API
  // response right after it is set here (or via resetPassword) - the admin
  // must copy it down then, same as any "reveal once" credential flow.
  private generateTempPassword(): string {
    return randomBytes(9).toString('base64url'); // 12 URL-safe chars
  }

  async create(dto: CreateDriverDto) {
    const existing = await this.prisma.driver.findFirst({
      where: { OR: [{ email: dto.email }, { employeeNumber: dto.employeeNumber }, { licenseNumber: dto.licenseNumber }] },
    });
    if (existing) throw new ConflictException('A driver with this email, employee number, or license already exists');

    const temporaryPassword = dto.password?.trim() || this.generateTempPassword();
    const hashed = await bcrypt.hash(temporaryPassword, 10);
    const driver = await this.prisma.driver.create({
      data: {
        employeeNumber: dto.employeeNumber,
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        licenseNumber: dto.licenseNumber,
        phone: dto.phone,
        assignedBusId: dto.assignedBusId,
      },
      select: DRIVER_SELECT,
    });
    return { ...driver, temporaryPassword };
  }

  async resetPassword(id: string) {
    await this.findOne(id);
    const temporaryPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.driver.update({ where: { id }, data: { password: hashed } });
    return { temporaryPassword };
  }

  async findAll() {
    return this.prisma.driver.findMany({
      select: DRIVER_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const driver = await this.prisma.driver.findUnique({ where: { id }, select: DRIVER_SELECT });
    if (!driver) throw new NotFoundException('Driver not found');
    return driver;
  }

  async update(id: string, dto: UpdateDriverDto) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: dto, select: DRIVER_SELECT });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: { isActive: false }, select: DRIVER_SELECT });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.driver.update({ where: { id }, data: { isActive: true }, select: DRIVER_SELECT });
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
