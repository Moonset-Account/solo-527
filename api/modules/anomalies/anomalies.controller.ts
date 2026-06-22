import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AnomaliesService } from './anomalies.service.js';
import { CostAnomaly } from '../../schemas/cost-anomaly.schema.js';

@ApiTags('anomalies')
@Controller('anomalies')
export class AnomaliesController {
  constructor(private readonly anomaliesService: AnomaliesService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Req() req?: Request,
  ): Promise<CostAnomaly[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.findAll({ type, severity, status }, isSandbox);
  }

  @Post('detect')
  async detectAnomalies(@Req() req?: Request): Promise<{ detected: number; anomalies: CostAnomaly[] }> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.detectAnomalies(isSandbox);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req?: Request): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.findOne(id, isSandbox);
  }

  @Post()
  async create(@Body() data: Partial<CostAnomaly>, @Req() req?: Request): Promise<CostAnomaly> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.create(data, isSandbox);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() data: Partial<CostAnomaly>,
    @Req() req?: Request,
  ): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.update(id, data, isSandbox);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req?: Request): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.remove(id, isSandbox);
  }

  @Post(':id/assign')
  async assignResponsible(
    @Param('id') id: string,
    @Body('responsiblePerson') responsiblePerson: string,
    @Req() req?: Request,
  ): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.assignResponsible(id, responsiblePerson, isSandbox);
  }

  @Post(':id/plan')
  async setHandlingPlan(
    @Param('id') id: string,
    @Body('handlingPlan') handlingPlan: string,
    @Req() req?: Request,
  ): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.setHandlingPlan(id, handlingPlan, isSandbox);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Req() req?: Request,
  ): Promise<CostAnomaly | null> {
    const isSandbox = req?.isSandbox ?? false;
    return this.anomaliesService.updateStatus(id, status, isSandbox);
  }
}
