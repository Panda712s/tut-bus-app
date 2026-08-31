import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTripDto {
  @IsString() @IsNotEmpty() busId: string;
  @IsString() @IsNotEmpty() routeId: string;
}
