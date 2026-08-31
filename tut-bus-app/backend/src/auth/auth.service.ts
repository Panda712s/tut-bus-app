import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums/role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type AccountType = 'student' | 'driver' | 'admin';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {}

  // ---------- Student ----------

  async registerStudent(dto: RegisterStudentDto) {
    const existing = await this.prisma.student.findFirst({
      where: { OR: [{ email: dto.email }, { studentNumber: dto.studentNumber }] },
    });
    if (existing) {
      throw new ConflictException('A student with this email or student number already exists');
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const student = await this.prisma.student.create({
      data: {
        studentNumber: dto.studentNumber,
        fullName: dto.fullName,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
      },
    });

    const otp = await this.generateOtp(student.id, 'EMAIL_VERIFICATION');
    // In production this triggers an email/SMS send. Logged here so the flow is demonstrable end-to-end.
    console.log(`[OTP] Verification code for ${student.email}: ${otp}`);

    return {
      message: 'Registration successful. Please verify your TUT email using the OTP sent to you.',
      studentId: student.id,
    };
  }

  async verifyStudentOtp(dto: VerifyOtpDto) {
    const student = await this.prisma.student.findUnique({ where: { email: dto.email } });
    if (!student) throw new BadRequestException('Student not found');

    const otp = await this.prisma.otpCode.findFirst({
      where: { studentId: student.id, code: dto.code, purpose: 'EMAIL_VERIFICATION', consumed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } }),
      this.prisma.student.update({ where: { id: student.id }, data: { emailVerified: true } }),
    ]);

    return this.buildAuthResponse(student.id, student.email, Role.STUDENT);
  }

  async loginStudent(dto: LoginDto) {
    const student = await this.prisma.student.findUnique({ where: { email: dto.email } });
    if (!student || !(await bcrypt.compare(dto.password, student.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!student.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }
    if (!student.emailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    return this.buildAuthResponse(student.id, student.email, Role.STUDENT);
  }

  // ---------- Driver ----------

  async loginDriver(dto: LoginDto) {
    const driver = await this.prisma.driver.findUnique({ where: { email: dto.email } });
    if (!driver || !(await bcrypt.compare(dto.password, driver.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!driver.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }
    return this.buildAuthResponse(driver.id, driver.email, Role.DRIVER);
  }

  // ---------- Admin ----------

  async loginAdmin(dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (!admin || !(await bcrypt.compare(dto.password, admin.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!admin.isActive) {
      throw new UnauthorizedException('This account has been deactivated');
    }
    return this.buildAuthResponse(admin.id, admin.email, Role.ADMIN);
  }

  // ---------- Password reset (all account types) ----------

  async requestPasswordReset(accountType: AccountType, dto: RequestPasswordResetDto) {
    const account = await this.findAccount(accountType, dto.email);
    // Always return a generic message to avoid leaking which emails are registered.
    if (!account) {
      return { message: 'If an account exists for this email, a reset code has been sent.' };
    }
    if (accountType === 'student') {
      const otp = await this.generateOtp(account.id, 'PASSWORD_RESET');
      console.log(`[OTP] Password reset code for ${dto.email}: ${otp}`);
    } else {
      console.log(`[OTP] Password reset requested for ${accountType} ${dto.email} (wire up email/SMS in production)`);
    }
    return { message: 'If an account exists for this email, a reset code has been sent.' };
  }

  async resetStudentPassword(dto: ResetPasswordDto) {
    const student = await this.prisma.student.findUnique({ where: { email: dto.email } });
    if (!student) throw new BadRequestException('Invalid request');

    const otp = await this.prisma.otpCode.findFirst({
      where: { studentId: student.id, code: dto.code, purpose: 'PASSWORD_RESET', consumed: false },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset code');
    }

    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.$transaction([
      this.prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } }),
      this.prisma.student.update({ where: { id: student.id }, data: { password: hashed } }),
    ]);

    return { message: 'Password has been reset successfully' };
  }

  // ---------- Token refresh ----------

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
      return this.buildAuthResponse(payload.sub, payload.email, payload.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // ---------- Helpers ----------

  private async findAccount(accountType: AccountType, email: string) {
    if (accountType === 'student') return this.prisma.student.findUnique({ where: { email } });
    if (accountType === 'driver') return this.prisma.driver.findUnique({ where: { email } });
    return this.prisma.admin.findUnique({ where: { email } });
  }

  private async generateOtp(studentId: string, purpose: string) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.prisma.otpCode.create({ data: { studentId, code, purpose, expiresAt } });
    return code;
  }

  private buildAuthResponse(id: string, email: string, role: Role) {
    const payload = { sub: id, email, role };
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') ?? '15m',
    });
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    });
    return {
      accessToken,
      refreshToken,
      user: { id, email, role },
    };
  }
}
