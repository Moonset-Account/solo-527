import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { BatchesService } from './batches.service.js';
import { Batch } from '../../schemas/batch.schema.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';

@ApiTags('batches')
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'recipeId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async findAll(
    @Req() req: Request,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('recipeId') recipeId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<PaginatedResult<Batch>> {
    return this.batchesService.findAll(
      {
        startDate,
        endDate,
        recipeId,
        teamId,
        status,
        search,
        page: page ? parseInt(page, 10) : undefined,
        pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      },
      req.isSandbox,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<Batch | null> {
    return this.batchesService.findOne(id, req.isSandbox);
  }

  @Post()
  async create(@Body() data: Partial<Batch>, @Req() req: Request): Promise<Batch> {
    return this.batchesService.create(data, req.isSandbox);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Batch>, @Req() req: Request): Promise<Batch | null> {
    return this.batchesService.update(id, data, 'system', req.isSandbox);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request): Promise<Batch | null> {
    return this.batchesService.remove(id, req.isSandbox);
  }

  @Post(':id/pickup')
  async pickUp(@Param('id') id: string, @Req() req: Request): Promise<Batch | null> {
    return this.batchesService.pickUp(id, 'system', req.isSandbox);
  }

  @Post(':id/scrap')
  async recordScrap(
    @Param('id') id: string,
    @Body() scrapData: { quantity: number; reason: string; ingredientId?: string; ingredientName?: string },
    @Req() req: Request,
  ): Promise<Batch | null> {
    return this.batchesService.recordScrap(id, scrapData, 'system', req.isSandbox);
  }

  @Post(':id/rework')
  async recordRework(
    @Param('id') id: string,
    @Body() reworkData: { reworkQty: number; reworkCost: number; reason?: string },
    @Req() req: Request,
  ): Promise<Batch | null> {
    return this.batchesService.recordRework(id, reworkData, 'system', req.isSandbox);
  }

  @Post(':id/notes')
  async addNote(
    @Param('id') id: string,
    @Body() noteData: { content: string; author?: string },
    @Req() req: Request,
  ): Promise<Batch | null> {
    return this.batchesService.addNote(id, noteData, 'system', req.isSandbox);
  }

  @Post(':id/attachments')
  async addAttachment(
    @Param('id') id: string,
    @Body() attachmentData: { url: string; name: string },
    @Req() req: Request,
  ): Promise<Batch | null> {
    return this.batchesService.addAttachment(id, attachmentData, 'system', req.isSandbox);
  }

  @Post(':id/calculate-costs')
  async calculateCosts(@Param('id') id: string, @Req() req: Request): Promise<Batch | null> {
    return this.batchesService.calculateCosts(id, req.isSandbox);
  }
}
