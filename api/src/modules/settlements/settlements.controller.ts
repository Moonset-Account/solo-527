import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SettlementsService } from './settlements.service.js';
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { UpdateSettlementDto } from './dto/update-settlement.dto.js';
import { ApproveSettlementDto } from './dto/approve-settlement.dto.js';
import { CreateSettlementRuleDto } from './dto/create-settlement-rule.dto.js';
import { UpdateSettlementRuleDto } from './dto/update-settlement-rule.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  create(@Body() dto: CreateSettlementDto) {
    return this.settlementsService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.settlementsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSettlementDto) {
    return this.settlementsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.remove(id);
  }

  @Put(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number, @Body() dto: ApproveSettlementDto) {
    return this.settlementsService.approve(id, dto);
  }

  @Get('rules')
  findAllRules(@Query() query: PaginationQueryDto) {
    return this.settlementsService.findAllRules(query);
  }

  @Get('rules/:id')
  findOneRule(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.findOneRule(id);
  }

  @Post('rules')
  createRule(@Body() dto: CreateSettlementRuleDto) {
    return this.settlementsService.createRule(dto);
  }

  @Put('rules/:id')
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSettlementRuleDto) {
    return this.settlementsService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  removeRule(@Param('id', ParseIntPipe) id: number) {
    return this.settlementsService.removeRule(id);
  }
}
