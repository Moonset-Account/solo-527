import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('reconciliations')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  @AuditLog({ action: 'create', entityType: 'reconciliation', description: 'Create monthly reconciliation' })
  create(@Body() body: { period: string }) {
    return this.reconciliationService.create(body.period);
  }

  @Get()
  findAll(@Query('page') page: number = 1, @Query('limit') limit: number = 50) {
    return this.reconciliationService.findAll(page, limit);
  }

  @Get('statistics')
  getStatistics() {
    return this.reconciliationService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reconciliationService.findOne(id);
  }

  @Get(':id/linked-records')
  getLinkedRecords(@Param('id') id: string) {
    return this.reconciliationService.getLinkedRecords(id);
  }

  @Post(':id/link-record')
  @AuditLog({ action: 'link_record', entityType: 'reconciliation', description: 'Link record to reconciliation' })
  linkRecord(@Param('id') id: string, @Body() linkData: any) {
    return this.reconciliationService.linkRecord(id, linkData);
  }

  @Post(':id/variance')
  @AuditLog({ action: 'add_variance', entityType: 'reconciliation', description: 'Add variance to reconciliation' })
  addVariance(@Param('id') id: string, @Body() varianceData: any) {
    return this.reconciliationService.addVariance(id, varianceData);
  }

  @Put(':id/status')
  @AuditLog({ action: 'update_status', entityType: 'reconciliation', description: 'Update reconciliation status' })
  updateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return this.reconciliationService.updateStatus(id, body.status as any);
  }
}
