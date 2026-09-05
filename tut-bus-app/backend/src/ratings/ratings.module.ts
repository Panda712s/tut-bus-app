import { Module } from '@nestjs/common';
import { DriversModule } from '../drivers/drivers.module';
import { RatingsService } from './ratings.service';
import { RatingsController } from './ratings.controller';

@Module({
  imports: [DriversModule],
  controllers: [RatingsController],
  providers: [RatingsService],
})
export class RatingsModule {}
