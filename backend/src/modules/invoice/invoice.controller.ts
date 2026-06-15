import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto, UpdateInvoiceDto, InvoiceFilterDto } from './dto/invoice.dto';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('invoices')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @AuditLog({ action: 'create', entityType: 'invoice', description: 'Create new invoice' })
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Query() filters: InvoiceFilterDto) {
    return this.invoiceService.findAll(filters);
  }

  @Get('statistics')
  getStatistics(@Query() filters: any) {
    return this.invoiceService.getStatistics(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoiceService.findOne(id);
  }

  @Put(':id')
  @AuditLog({ action: 'update', entityType: 'invoice', description: 'Update invoice' })
  update(@Param('id') id: string, @Body() updateInvoiceDto: UpdateInvoiceDto) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Delete(':id')
  @AuditLog({ action: 'delete', entityType: 'invoice', description: 'Delete invoice' })
  delete(@Param('id') id: string) {
    return this.invoiceService.delete(id);
  }
}
