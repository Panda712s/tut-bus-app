import { IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateStopDto {
  @IsString() @IsNotEmpty() name: string;
  @IsLatitude() lat: number;
  @IsLongitude() lng: number;
  @IsOptional() @IsInt() order?: number;
  @IsString() @IsNotEmpty() routeId: string;
}
