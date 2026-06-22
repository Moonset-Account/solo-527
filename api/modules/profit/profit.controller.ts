import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ProfitService } from './profit.service.js';
import { ProfitRecord } from '../../schemas/profit-record.schema.js';

@ApiTags('profit')
@Controller('profit')
export class ProfitController {
  constructor(private readonly profitService: ProfitService) {}

  @Get('trend')
  async getTrend(
    @Query('period') period?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: Request,
  ): Promise<any[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.getTrend({ period, dateFrom, dateTo }, isSandbox);
  }

  @Get('summary')
  async getSummary(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: Request,
  ): Promise<any> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.getSummary({ dateFrom, dateTo }, isSandbox);
  }

  @Get('by-recipe')
  async getByRecipe(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: Request,
  ): Promise<any[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.getByRecipe({ dateFrom, dateTo }, isSandbox);
  }

  @Get('by-batch')
  async getByBatch(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: Request,
  ): Promise<any[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.getByBatch({ dateFrom, dateTo }, isSandbox);
  }

  @Get('by-team')
  async getByTeam(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Req() req?: Request,
  ): Promise<any[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.getByTeam({ dateFrom, dateTo }, isSandbox);
  }

  @Get()
  async findAll(@Req() req?: Request): Promise<ProfitRecord[]> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.findAll(isSandbox);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ProfitRecord | null> {
    return this.profitService.findOne(id);
  }

  @Post()
  async create(@Body() data: Partial<ProfitRecord>, @Req() req?: Request): Promise<ProfitRecord> {
    const isSandbox = req?.isSandbox ?? false;
    return this.profitService.createRecord(data, isSandbox);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<ProfitRecord>): Promise<ProfitRecord | null> {
    return this.profitService.update(id, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ProfitRecord | null> {
    return this.profitService.remove(id);
  }
}
