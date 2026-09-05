import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit/audit-log.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

const DRIVER_SELECT = {
  id: true, employeeNumber: true, fullName: true, email: true, phone: true,
  licenseNumber: true, profileImageUrl: true, status: true, isActive: true, assignedBusId: true, createdAt: true,
};

@Injectable()
export class DriversService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  // Passwords are one-way hashed and never stored or returned in plaintext.
  // The only place a driver's password is ever visible is the single API
  // response right after it is set here (or via resetPassword) - the admin
  // must copy it down then, same as any "reveal once" credential flow.
  private generateTempPassword(): string {
    return randomBytes(9).toString('base64url'); // 12 URL-safe chars
  }

  async create(dto: CreateDriverDto, adminId?: string) {
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

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'driver.create',
        'Driver',
        driver.id,
        `Created driver ${driver.fullName} (${driver.employeeNumber})`,
      )
      .catch(() => undefined);

    return { ...driver, temporaryPassword };
  }

  async resetPassword(id: string, adminId?: string) {
    const driver = await this.findOne(id);
    const temporaryPassword = this.generateTempPassword();
    const hashed = await bcrypt.hash(temporaryPassword, 10);
    await this.prisma.driver.update({ where: { id }, data: { password: hashed } });

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'driver.resetPassword',
        'Driver',
        id,
        `Reset password for driver ${driver.fullName} (${driver.employeeNumber})`,
      )
      .catch(() => undefined);

    return { temporaryPassword };
  }

  /** Driver-initiated password change - unlike resetPassword (admin-only,
   * generates a random one), this lets the driver pick their own new
   * password after proving they still know the current one. */
  async changeOwnPassword(id: string, dto: ChangePasswordDto) {
    const driver = await this.prisma.driver.findUnique({ where: { id } });
    if (!driver) throw new NotFoundException('Driver not found');

    const matches = await bcrypt.compare(dto.currentPassword, driver.password);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.driver.update({ where: { id }, data: { password: hashed } });
    return { success: true };
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

  async update(id: string, dto: UpdateDriverDto, adminId?: string) {
    await this.findOne(id);
    const driver = await this.prisma.driver.update({ where: { id }, data: dto, select: DRIVER_SELECT });

    // Only log when an admin drove this update (adminId set) - a driver
    // updating their own profile via updateMe is not an admin action.
    if (adminId) {
      this.auditLog
        .log({ id: adminId }, 'driver.update', 'Driver', driver.id, `Updated driver ${driver.fullName} (${driver.employeeNumber})`)
        .catch(() => undefined);
    }

    return driver;
  }

  async deactivate(id: string, adminId?: string) {
    await this.findOne(id);
    const driver = await this.prisma.driver.update({ where: { id }, data: { isActive: false }, select: DRIVER_SELECT });

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'driver.deactivate',
        'Driver',
        driver.id,
        `Deactivated driver ${driver.fullName} (${driver.employeeNumber})`,
      )
      .catch(() => undefined);

    return driver;
  }

  async activate(id: string, adminId?: string) {
    await this.findOne(id);
    const driver = await this.prisma.driver.update({ where: { id }, data: { isActive: true }, select: DRIVER_SELECT });

    this.auditLog
      .log(
        adminId ? { id: adminId } : undefined,
        'driver.activate',
        'Driver',
        driver.id,
        `Activated driver ${driver.fullName} (${driver.employeeNumber})`,
      )
      .catch(() => undefined);

    return driver;
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
