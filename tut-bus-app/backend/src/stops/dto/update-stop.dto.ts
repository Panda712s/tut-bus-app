import { IsInt, IsLatitude, IsLongitude, IsOptional, IsString } from 'class-validator';

export class UpdateStopDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsLatitude() lat?: number;
  @IsOptional() @IsLongitude() lng?: number;
  @IsOptional() @IsInt() order?: number;
}
