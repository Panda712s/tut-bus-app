import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDriverDto {
  @IsString() @IsNotEmpty() employeeNumber: string;
  @IsString() @IsNotEmpty() fullName: string;
  @IsEmail() email: string;
  // Optional: if left blank, the server generates a random temporary password
  // and returns it once in the create response for the admin to hand to the driver.
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsString() @IsNotEmpty() licenseNumber: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() assignedBusId?: string;
}
