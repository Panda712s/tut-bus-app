import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { ReportIncidentDto } from './dto/report-incident.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateDriverDto) {
    return this.drivers.create(dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.drivers.findAll();
  }

  @Get('me')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.drivers.findOne(user.id);
  }

  @Patch('me')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(user.id, dto);
  }

  @Post('me/incidents')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  reportIncident(@CurrentUser() user: AuthenticatedUser, @Body() dto: ReportIncidentDto) {
    return this.drivers.reportIncident(user.id, dto);
  }

  @Get('me/incidents')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER)
  myIncidents(@CurrentUser() user: AuthenticatedUser) {
    return this.drivers.myIncidentReports(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.drivers.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateDriverDto) {
    return this.drivers.update(id, dto);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  deactivate(@Param('id') id: string) {
    return this.drivers.deactivate(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  activate(@Param('id') id: string) {
    return this.drivers.activate(id);
  }

  @Patch(':id/reset-password')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resetPassword(@Param('id') id: string) {
    return this.drivers.resetPassword(id);
  }
}
