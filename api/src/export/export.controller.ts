import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExportService } from './export.service.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('api/exports')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Post()
  async createExport(
    @Body() body: { queryCriteria: Record<string, unknown>; fileName: string },
    @CurrentUser() user: { id: number; displayName: string },
  ) {
    const record = await this.exportService.createExport(
      user.id,
      body.queryCriteria,
      body.fileName,
    );
    return record;
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.exportService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id/download')
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const record = await this.exportService.findOne(id);
    if (!record) {
      throw new Error('Export record not found');
    }
    const csv = this.exportService.generateCsv(
      [],
      record.queryCriteria,
      record.exporter?.displayName || 'unknown',
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${record.fileName}"`,
    );
    res.send(csv);
  }
}
