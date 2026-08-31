import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';

@Controller('buses')
export class BusesController {
  constructor(private readonly buses: BusesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateBusDto) {
    return this.buses.create(dto);
  }

  @Public()
  @Get()
  findAll() {
    return this.buses.findAll();
  }

  @Public()
  @Get('live')
  live(@Query('routeId') routeId?: string) {
    return routeId ? this.buses.liveBusesForRoute(routeId) : this.buses.liveBusesAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buses.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateBusDto) {
    return this.buses.update(id, dto);
  }

  @Patch(':id/passenger-count')
  @UseGuards(RolesGuard)
  @Roles(Role.DRIVER, Role.ADMIN)
  updatePassengerCount(@Param('id') id: string, @Body('passengerCount') passengerCount: number) {
    return this.buses.updatePassengerCount(id, passengerCount);
  }

  @Patch(':id/decommission')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.buses.remove(id);
  }
}
