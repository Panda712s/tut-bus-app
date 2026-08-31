import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { DriversModule } from './drivers/drivers.module';
import { AdminsModule } from './admins/admins.module';
import { BusesModule } from './buses/buses.module';
import { RoutesModule } from './routes/routes.module';
import { StopsModule } from './stops/stops.module';
import { TripsModule } from './trips/trips.module';
import { SchedulesModule } from './schedules/schedules.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeedbackModule } from './feedback/feedback.module';
import { GpsModule } from './gps/gps.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { EtaModule } from './eta/eta.module';
import { TrackingModule } from './tracking/tracking.module';
import { SafetyModule } from './safety/safety.module';
import { OpsModule } from './ops/ops.module';
import { RatingsModule } from './ratings/ratings.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    AuthModule,
    StudentsModule,
    DriversModule,
    AdminsModule,
    BusesModule,
    RoutesModule,
    StopsModule,
    TripsModule,
    SchedulesModule,
    NotificationsModule,
    FeedbackModule,
    GpsModule,
    AnalyticsModule,
    EtaModule,
    TrackingModule,
    SafetyModule,
    OpsModule,
    RatingsModule,
  ],
  providers: [
    // Every route requires a valid JWT unless explicitly marked with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
