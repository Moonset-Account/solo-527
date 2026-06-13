import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AfterSaleService, AfterSaleReport } from './after-sale.service.js';
import { CreateAfterSaleDto, UpdateAfterSaleDto, AssignAfterSaleDto, AfterSaleFilterDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ExportService } from '../export/export.service.js';

@Controller('after-sale')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class AfterSaleController {
  constructor(
    private afterSaleService: AfterSaleService,
    private exportService: ExportService,
  ) {}

  @Get()
  async findAll(@Query() filters: AfterSaleFilterDto) {
    return this.afterSaleService.findAll(filters);
  }

  @Get('report')
  async getReport(@Query('period') period: string = 'month'): Promise<AfterSaleReport> {
    return this.afterSaleService.getReport(period);
  }

  @Post()
  async create(@Body() dto: CreateAfterSaleDto) {
    return this.afterSaleService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAfterSaleDto) {
    return this.afterSaleService.update(id, dto);
  }

  @Post(':id/assign')
  async assign(@Param('id') id: string, @Body() dto: AssignAfterSaleDto) {
    return this.afterSaleService.assign(id, dto.assigneeId);
  }

  @Post(':id/close')
  async close(@Param('id') id: string) {
    return this.afterSaleService.close(id);
  }
}
