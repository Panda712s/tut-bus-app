import { IsString } from 'class-validator';

export class AddFavouriteRouteDto {
  @IsString()
  routeId: string;
}

export class AddFavouriteStopDto {
  @IsString()
  stopId: string;
}
