import { Body, Controller, Post } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { RegisterStudentDto } from './dto/register-student.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // ----- Student -----

  @Public()
  @Post('student/register')
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.auth.registerStudent(dto);
  }

  @Public()
  @Post('student/verify-otp')
  verifyStudentOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyStudentOtp(dto);
  }

  @Public()
  @Post('student/login')
  loginStudent(@Body() dto: LoginDto) {
    return this.auth.loginStudent(dto);
  }

  @Public()
  @Post('student/request-password-reset')
  requestStudentPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.auth.requestPasswordReset('student', dto);
  }

  @Public()
  @Post('student/reset-password')
  resetStudentPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetStudentPassword(dto);
  }

  // ----- Driver -----

  @Public()
  @Post('driver/login')
  loginDriver(@Body() dto: LoginDto) {
    return this.auth.loginDriver(dto);
  }

  // ----- Admin -----

  @Public()
  @Post('admin/login')
  loginAdmin(@Body() dto: LoginDto) {
    return this.auth.loginAdmin(dto);
  }

  // ----- Shared -----

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken);
  }
}
