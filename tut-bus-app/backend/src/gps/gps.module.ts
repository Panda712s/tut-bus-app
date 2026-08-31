import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GpsService } from './gps.service';
import { GpsGateway } from './gps.gateway';
import { GpsController } from './gps.controller';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [JwtModule.register({}), TrackingModule],
  controllers: [GpsController],
  providers: [GpsService, GpsGateway],
  exports: [GpsService],
})
export class GpsModule {}
