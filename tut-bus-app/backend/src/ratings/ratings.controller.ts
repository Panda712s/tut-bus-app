import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RatingsService } from './ratings.service';
import { CreateRatingDto } from './dto/create-rating.dto';
import { STUDENT_TO_DRIVER_TAGS, DRIVER_TO_TRIP_TAGS } from './rating-tags';

@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratings: RatingsService) {}

  /** The set of structured tags each role may attach - so clients can render chips. */
  @Public()
  @Get('tags')
  tags() {
    return { studentToDriver: STUDENT_TO_DRIVER_TAGS, driverToTrip: DRIVER_TO_TRIP_TAGS };
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRatingDto) {
    return this.ratings.submit(user, dto);
  }

  @Get('recent')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  recent() {
    return this.ratings.recent();
  }

  @Public()
  @Get('trip/:tripId')
  forTrip(@Param('tripId') tripId: string) {
    return this.ratings.forTrip(tripId);
  }

  @Get('driver/:driverId/summary')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.DRIVER)
  driverSummary(@Param('driverId') driverId: string) {
    return this.ratings.driverSummary(driverId);
  }

  @Public()
  @Get('trip/:tripId/receipt')
  receipt(@Param('tripId') tripId: string) {
    return this.ratings.receipt(tripId);
  }
}
