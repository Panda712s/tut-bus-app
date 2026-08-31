import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { BusStatus } from '@prisma/client';

export class UpdateBusDto {
  @IsOptional() @IsString() plateNumber?: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsEnum(BusStatus) status?: BusStatus;
  @IsOptional() @IsString() currentRouteId?: string;
}
