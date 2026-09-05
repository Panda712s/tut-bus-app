import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { FcmService } from './fcm.service';
import { AuditLogModule } from '../audit/audit-log.module';

@Module({
  imports: [AuditLogModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsGateway, FcmService],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
