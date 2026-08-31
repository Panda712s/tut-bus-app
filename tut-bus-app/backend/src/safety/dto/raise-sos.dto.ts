import { IsLatitude, IsLongitude, IsOptional, IsString, MaxLength } from 'class-validator';

export class RaiseSosDto {
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsString() tripId?: string;
}
