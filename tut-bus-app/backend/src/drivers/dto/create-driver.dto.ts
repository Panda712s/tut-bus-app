import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString() @IsNotEmpty() employeeNumber: string;
  @IsString() @IsNotEmpty() fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsString() @IsNotEmpty() licenseNumber: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() assignedBusId?: string;
}
