import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuditService } from './audit.service';
import { AuditLogFilterDto, EntityType } from './dto/audit.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query() filters: AuditLogFilterDto) {
    return this.auditService.findAll(filters);
  }

  @Get('export')
  async exportLogs(@Query() filters: AuditLogFilterDto, @Res() res: Response) {
    const csvContent = await this.auditService.exportLogs(filters);
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: EntityType,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.auditService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
