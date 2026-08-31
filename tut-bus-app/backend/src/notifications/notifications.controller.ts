import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateNotificationDto, @CurrentUser() user: AuthenticatedUser) {
    return this.notifications.create(dto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.notifications.findAll();
  }

  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    if (user.role === Role.DRIVER) return this.notifications.findForDriver(user.id);
    return this.notifications.findForStudent(user.id);
  }

  @Patch(':recipientId/read')
  markRead(@Param('recipientId') recipientId: string) {
    return this.notifications.markRead(recipientId);
  }
}
