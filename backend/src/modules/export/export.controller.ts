import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { CreateExportDto, ExportFilterDto } from './dto/export.dto';
import { AuditLog } from '@/common/decorators/audit-log.decorator';

@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post()
  @AuditLog({ action: 'create', entityType: 'export', description: 'Create export request' })
  create(@Body() createExportDto: CreateExportDto) {
    return this.exportService.create(createExportDto);
  }

  @Get()
  findAll(@Query() filters: ExportFilterDto) {
    return this.exportService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exportService.findOne(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { stream, fileName, mimeType } = await this.exportService.download(id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    stream.pipe(res);
  }

  @Post(':id/retry')
  @AuditLog({ action: 'retry', entityType: 'export', description: 'Retry failed export' })
  retry(@Param('id') id: string) {
    return this.exportService.retry(id);
  }
}
