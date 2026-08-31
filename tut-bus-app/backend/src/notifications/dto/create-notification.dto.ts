import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { NotificationAudience, NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsEnum(NotificationAudience)
  audience: NotificationAudience;

  @IsOptional()
  @IsString()
  routeId?: string;

  @IsOptional()
  @IsString()
  targetStudentId?: string;

  @IsOptional()
  @IsString()
  targetDriverId?: string;
}
