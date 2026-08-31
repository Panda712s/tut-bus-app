import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GpsUpdateDto {
  @IsString() @IsNotEmpty() busId: string;
  @IsOptional() @IsString() tripId?: string;
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsOptional() @IsNumber() speedKmh?: number;
  @IsOptional() @IsNumber() heading?: number;

  /**
   * When the fix was taken on the device. Set by the driver app when
   * flushing a queue of pings buffered while offline; defaults to now.
   */
  @IsOptional() @IsISO8601() recordedAt?: string;
}

export class GpsBatchDto {
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => GpsUpdateDto)
  pings: GpsUpdateDto[];
}
