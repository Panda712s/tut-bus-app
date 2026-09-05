import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';

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
    return this.notifications.findForUser(user);
  }

  @Patch(':recipientId/read')
  markRead(@Param('recipientId') recipientId: string) {
    return this.notifications.markRead(recipientId);
  }

  @Post('device-token')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  registerDeviceToken(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeviceTokenDto) {
    return this.notifications.registerDeviceToken(user, dto);
  }

  @Delete('device-token/:token')
  @UseGuards(RolesGuard)
  @Roles(Role.STUDENT, Role.DRIVER)
  unregisterDeviceToken(@Param('token') token: string) {
    return this.notifications.unregisterDeviceToken(token);
  }
}
