import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { TUT_STUDENT_EMAIL_REGEX } from '../tut-email';

export class RegisterStudentDto {
  @IsString()
  @IsNotEmpty()
  studentNumber: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @Matches(TUT_STUDENT_EMAIL_REGEX, {
    message: 'Use your TUT student email address (yourname@tut4life.ac.za)',
  })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
