import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('operator') operator?: string,
  ) {
    return this.auditLogsService.findAll(pagination, entityType, action, operator);
  }
}
