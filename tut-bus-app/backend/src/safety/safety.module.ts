import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController } from './safety.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EtaModule } from '../eta/eta.module';

@Module({
  imports: [NotificationsModule, EtaModule],
  controllers: [SafetyController],
  providers: [SafetyService],
})
export class SafetyModule {}
