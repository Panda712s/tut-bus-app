import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums/role.enum';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogs: AuditLogService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
    @Query('targetType') targetType?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogs.list({
      limit: limit ? Number(limit) : undefined,
      cursor,
      targetType,
      action,
    });
  }
}
