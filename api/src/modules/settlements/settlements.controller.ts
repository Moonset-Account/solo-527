import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { SettlementsService } from './settlements.service.js';
import { CreateSettlementDto } from './dto/create-settlement.dto.js';
import { UpdateSettlementDto } from './dto/update-settlement.dto.js';
import { ApproveSettlementDto } from './dto/approve-settlement.dto.js';

@Controller('settlements')
export class SettlementsController {
  constructor(private readonly settlementsService: SettlementsService) {}

  @Post()
  create(@Body() dto: CreateSettlementDto) {
    return this.settlementsService.create(dto);
  }

  @Get()
  findAll() {
    return this.settlementsService.findAll();
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
}
