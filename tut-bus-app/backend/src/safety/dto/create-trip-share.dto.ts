import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTripShareDto {
  @IsString() @IsNotEmpty() tripId: string;

  /** How long the share link stays live, in hours (default 2, max 24). */
  @IsOptional() @IsInt() @Min(1) @Max(24) hours?: number;
}
