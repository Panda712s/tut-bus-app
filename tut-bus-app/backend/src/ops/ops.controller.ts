import { Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { DeviationStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { OpsService } from './ops.service';

@Controller('ops')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class OpsController {
  constructor(private readonly ops: OpsService) {}

  @Get('fleet')
  fleet() {
    return this.ops.fleet();
  }

  @Get('deviations')
  deviations(@Query('status') status?: DeviationStatus) {
    return this.ops.deviationAlerts(status);
  }

  @Patch('deviations/:id/clear')
  clearDeviation(@Param('id') id: string) {
    return this.ops.clearDeviation(id);
  }
}
