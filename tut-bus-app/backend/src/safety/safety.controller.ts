import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SosStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SafetyService } from './safety.service';
import { RaiseSosDto } from './dto/raise-sos.dto';
import { CreateTripShareDto } from './dto/create-trip-share.dto';

@Controller('safety')
export class SafetyController {
  constructor(private readonly safety: SafetyService) {}

  // ----- SOS -----

  @Post('sos')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  raiseSos(@CurrentUser() user: AuthenticatedUser, @Body() dto: RaiseSosDto) {
    return this.safety.raiseSos(user, dto);
  }

  @Get('sos')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  listSos(@Query('status') status?: SosStatus) {
    return this.safety.listSos(status);
  }

  @Patch('sos/:id/acknowledge')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  acknowledgeSos(@Param('id') id: string) {
    return this.safety.acknowledgeSos(id);
  }

  @Patch('sos/:id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resolveSos(@Param('id') id: string) {
    return this.safety.resolveSos(id);
  }

  // ----- Trip sharing -----

  @Post('shares')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  createShare(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTripShareDto) {
    return this.safety.createShare(user, dto);
  }

  @Get('shares/me')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  listMyShares(@CurrentUser() user: AuthenticatedUser) {
    return this.safety.listMyShares(user);
  }

  @Delete('shares/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  revokeShare(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.safety.revokeShare(user, id);
  }

  /** Public: anyone with the link can watch the trip until it expires. */
  @Public()
  @Get('shares/:token/live')
  resolveShare(@Param('token') token: string) {
    return this.safety.resolveShare(token);
  }
}
