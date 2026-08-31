import { IsEnum, IsMilitaryTime, IsNotEmpty, IsString } from 'class-validator';
import { DayType, SchedulePeriod } from '@prisma/client';

export class CreateScheduleDto {
  @IsString() @IsNotEmpty() routeId: string;
  @IsEnum(DayType) dayType: DayType;
  @IsEnum(SchedulePeriod) period: SchedulePeriod;
  @IsMilitaryTime() departureTime: string;
}
