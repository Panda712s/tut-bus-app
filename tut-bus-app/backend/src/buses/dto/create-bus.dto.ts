import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateBusDto {
  @IsString() @IsNotEmpty() busNumber: string;
  @IsString() @IsNotEmpty() plateNumber: string;
  @IsOptional() @IsInt() @Min(1) capacity?: number;
  @IsOptional() @IsString() currentRouteId?: string;
}
