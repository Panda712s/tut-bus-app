import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterDeviceTokenDto {
  @IsString() @IsNotEmpty() token: string;
  @IsOptional() @IsIn(['android', 'ios', 'web']) platform?: string;
}
