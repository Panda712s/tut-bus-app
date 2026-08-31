import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { GpsService } from './gps.service';
import { GpsUpdateDto } from './dto/gps-update.dto';

/**
 * REST fallback for GPS pings (useful for testing with curl/Postman, or a
 * driver client that isn't using the WebSocket channel). The WebSocket
 * gateway (gps.gateway.ts) is the primary, real-time path.
 */
@Controller('gps')
export class GpsController {
  constructor(private readonly gps: GpsService) {}

  @Post('ping')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  ping(@Body() dto: GpsUpdateDto) {
    return this.gps.recordPing(dto);
  }

  @Public()
  @Get('bus/:busId/history')
  history(@Param('busId') busId: string) {
    return this.gps.recentLogsForBus(busId);
  }

  @Public()
  @Get('trip/:tripId/history')
  tripHistory(@Param('tripId') tripId: string) {
    return this.gps.logsForTrip(tripId);
  }
}
