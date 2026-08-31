import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class GpsUpdateDto {
  @IsString() @IsNotEmpty() busId: string;
  @IsOptional() @IsString() tripId?: string;
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsOptional() @IsNumber() speedKmh?: number;
  @IsOptional() @IsNumber() heading?: number;
}
