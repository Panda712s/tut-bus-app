import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';

const ADMIN_SELECT = {
  id: true, fullName: true, email: true, role: true, isActive: true, createdAt: true,
};

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAdminDto, requesterId: string) {
    const requester = await this.prisma.admin.findUnique({ where: { id: requesterId } });
    if (!requester || requester.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can create new admin accounts');
    }
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('An admin with this email already exists');

    const hashed = await bcrypt.hash(dto.password, 10);
    return this.prisma.admin.create({
      data: { fullName: dto.fullName, email: dto.email, password: hashed, role: dto.role },
      select: ADMIN_SELECT,
    });
  }

  async findAll() {
    return this.prisma.admin.findMany({ select: ADMIN_SELECT });
  }

  async findOne(id: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id }, select: ADMIN_SELECT });
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }
}
