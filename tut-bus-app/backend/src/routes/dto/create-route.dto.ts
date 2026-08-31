import { IsNumber, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateRouteDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() origin: string;
  @IsString() @IsNotEmpty() destination: string;
  @IsOptional() @IsNumber() distanceKm?: number;
  @IsOptional() @IsInt() @Min(1) estimatedDurationMin?: number;
}
