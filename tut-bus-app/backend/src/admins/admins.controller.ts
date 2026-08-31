import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { AdminsService } from './admins.service';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('admins')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminsController {
  constructor(private readonly admins: AdminsService) {}

  @Post()
  create(@Body() dto: CreateAdminDto, @CurrentUser() user: AuthenticatedUser) {
    return this.admins.create(dto, user.id);
  }

  @Get()
  findAll() {
    return this.admins.findAll();
  }

  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.admins.findOne(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.admins.findOne(id);
  }
}
