import { Module } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [TrackingService],
  exports: [TrackingService],
})
export class TrackingModule {}
