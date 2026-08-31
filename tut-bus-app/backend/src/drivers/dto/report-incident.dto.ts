import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportType } from '@prisma/client';

export class ReportIncidentDto {
  @IsEnum(ReportType) type: ReportType;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() tripId?: string;
}
