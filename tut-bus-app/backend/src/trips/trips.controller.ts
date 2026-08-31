import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TripStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { Public } from '../common/decorators/public.decorator';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';

@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Public()
  @Get()
  findAll(@Query('driverId') driverId?: string, @Query('busId') busId?: string, @Query('status') status?: TripStatus) {
    return this.trips.findAll({ driverId, busId, status });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.trips.findOne(id);
  }

  @Post('start')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  start(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTripDto) {
    return this.trips.start(user.id, dto);
  }

  @Post(':id/pause')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  pause(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.pause(user.id, id);
  }

  @Post(':id/resume')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.resume(user.id, id);
  }

  @Post(':id/end')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  end(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.end(user.id, id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.cancel(user.id, id);
  }

  // ----- Student boarding (QR Code Boarding feature) -----

  @Post(':id/board')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  board(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body('qrScanned') qrScanned?: boolean) {
    return this.trips.board(user.id, id, Boolean(qrScanned));
  }

  @Post(':id/alight')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT)
  alight(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.trips.alight(user.id, id);
  }
}
