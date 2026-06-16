import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service.js';
import { CreateWorkOrderDto } from './dto/create-work-order.dto.js';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto.js';
import { FollowUpDto } from './dto/follow-up.dto.js';

@Controller('work-orders')
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  create(@Body() dto: CreateWorkOrderDto) {
    return this.workOrdersService.create(dto);
  }

  @Get()
  findAll() {
    return this.workOrdersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.workOrdersService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkOrderDto) {
    return this.workOrdersService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.workOrdersService.remove(id);
  }

  @Post(':id/follow-up')
  followUp(@Param('id', ParseIntPipe) id: number, @Body() _dto: FollowUpDto) {
    return this.workOrdersService.followUp(id);
  }
}
