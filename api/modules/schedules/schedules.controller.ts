import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { SchedulesService } from './schedules.service.js';
import { Schedule } from '../../schemas/schedule.schema.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

@ApiTags('schedules')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiQuery({ name: 'dateFrom', required: false, description: '开始日期' })
  @ApiQuery({ name: 'dateTo', required: false, description: '结束日期' })
  @ApiQuery({ name: 'teamId', required: false, description: '班组ID' })
  @ApiQuery({ name: 'status', required: false, description: '状态' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async findAll(
    @Req() req: Request,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResult<Schedule>> {
    return this.schedulesService.findAll(
      {
        dateFrom,
        dateTo,
        teamId,
        status,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
      req.isSandbox,
    );
  }

  @Get('date/:date')
  async findByDate(
    @Req() req: Request,
    @Param('date') date: string,
  ): Promise<Schedule[]> {
    return this.schedulesService.findByDate(date, req.isSandbox);
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Schedule | null> {
    return this.schedulesService.findOne(id, req.isSandbox);
  }

  @Post()
  async create(
    @Req() req: Request,
    @Body() data: Partial<Schedule>,
  ): Promise<Schedule> {
    return this.schedulesService.create(data, req.isSandbox);
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() data: Partial<Schedule>,
  ): Promise<Schedule | null> {
    return this.schedulesService.update(id, data, req.isSandbox);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<Schedule | null> {
    return this.schedulesService.remove(id, req.isSandbox);
  }

  @Post(':id/batches')
  async addBatch(
    @Req() req: Request,
    @Param('id') scheduleId: string,
    @Body() batchData: { batchId: string; batchNo: string; recipeName: string; plannedQty: number; unit: string },
  ): Promise<Schedule | null> {
    return this.schedulesService.addBatch(scheduleId, batchData, req.isSandbox);
  }

  @Delete(':id/batches/:batchId')
  async removeBatch(
    @Req() req: Request,
    @Param('id') scheduleId: string,
    @Param('batchId') batchId: string,
  ): Promise<Schedule | null> {
    return this.schedulesService.removeBatch(scheduleId, batchId, req.isSandbox);
  }
}
