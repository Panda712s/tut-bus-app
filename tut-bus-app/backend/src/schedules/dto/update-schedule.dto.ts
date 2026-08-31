import { IsBoolean, IsEnum, IsMilitaryTime, IsOptional } from 'class-validator';
import { DayType, SchedulePeriod } from '@prisma/client';

export class UpdateScheduleDto {
  @IsOptional() @IsEnum(DayType) dayType?: DayType;
  @IsOptional() @IsEnum(SchedulePeriod) period?: SchedulePeriod;
  @IsOptional() @IsMilitaryTime() departureTime?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
