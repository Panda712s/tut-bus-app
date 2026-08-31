import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('trips-per-day')
  tripsPerDay(@Query('days') days?: string) {
    return this.analytics.tripsPerDay(days ? parseInt(days, 10) : undefined);
  }

  @Get('busiest-routes')
  busiestRoutes(@Query('limit') limit?: string) {
    return this.analytics.busiestRoutes(limit ? parseInt(limit, 10) : undefined);
  }

  @Get('incidents')
  incidents() {
    return this.analytics.incidentBreakdown();
  }
}
