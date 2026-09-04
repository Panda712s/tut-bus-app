import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { StudentsService } from './students.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AddFavouriteRouteDto, AddFavouriteStopDto } from './dto/add-favourite.dto';

@Controller('students')
export class StudentsController {
  constructor(private readonly students: StudentsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.students.findAll();
  }

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.students.findOne(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStudentDto) {
    return this.students.update(user.id, dto);
  }

  @Get('me/favourites/routes')
  myFavouriteRoutes(@CurrentUser() user: AuthenticatedUser) {
    return this.students.listFavouriteRoutes(user.id);
  }

  @Post('me/favourites/routes')
  addFavouriteRoute(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavouriteRouteDto) {
    return this.students.addFavouriteRoute(user.id, dto.routeId);
  }

  @Delete('me/favourites/routes/:routeId')
  removeFavouriteRoute(@CurrentUser() user: AuthenticatedUser, @Param('routeId') routeId: string) {
    return this.students.removeFavouriteRoute(user.id, routeId);
  }

  @Post('me/favourites/stops')
  addFavouriteStop(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddFavouriteStopDto) {
    return this.students.addFavouriteStop(user.id, dto.stopId);
  }

  @Delete('me/favourites/stops/:stopId')
  removeFavouriteStop(@CurrentUser() user: AuthenticatedUser, @Param('stopId') stopId: string) {
    return this.students.removeFavouriteStop(user.id, stopId);
  }

  @Get('me/trip-history')
  myTripHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.students.tripHistory(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.students.findOne(id);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.students.deactivate(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string) {
    return this.students.activate(id);
  }
}
