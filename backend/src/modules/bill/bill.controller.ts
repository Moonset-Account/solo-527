import { Controller, Get, Post, Put, Body, Param, Query, UseInterceptors } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillService } from './bill.service';
import { CreateBillDto, UpdateBillDto, UpdateBillStatusDto, RecordPaymentDto, BillFilterDto } from './dto/bill.dto';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('bills')
export class BillController {
  constructor(private readonly billService: BillService) {}

  @Post()
  @AuditLog({ action: 'create', entityType: 'bill', description: 'Create new bill' })
  create(@Body() createBillDto: CreateBillDto) {
    return this.billService.create(createBillDto);
  }

  @Get()
  findAll(@Query() filters: BillFilterDto) {
    return this.billService.findAll(filters);
  }

  @Get('statistics')
  getStatistics(@Query() filters: any) {
    return this.billService.getStatistics(filters);
  }

  @Get('overdue')
  getOverdueBills() {
    return this.billService.getOverdueBills();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billService.findOne(id);
  }

  @Put(':id')
  @AuditLog({ action: 'update', entityType: 'bill', description: 'Update bill' })
  update(@Param('id') id: string, @Body() updateBillDto: UpdateBillDto) {
    return this.billService.update(id, updateBillDto);
  }

  @Put(':id/status')
  @AuditLog({ action: 'update_status', entityType: 'bill', description: 'Update bill status' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateBillStatusDto) {
    return this.billService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/payment')
  @AuditLog({ action: 'record_payment', entityType: 'bill', description: 'Record bill payment' })
  recordPayment(@Param('id') id: string, @Body() paymentDto: RecordPaymentDto) {
    return this.billService.recordPayment(id, paymentDto);
  }

  @Get(':id/history')
  getStatusHistory(@Param('id') id: string) {
    return this.billService.getStatusHistory(id);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueUpdate() {
    await this.billService.updateOverdueStatuses();
  }
}
