import { IsBoolean, IsNumber, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRouteDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() origin?: string;
  @IsOptional() @IsString() destination?: string;
  @IsOptional() @IsNumber() distanceKm?: number;
  @IsOptional() @IsInt() @Min(1) estimatedDurationMin?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
