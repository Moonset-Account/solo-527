import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ConfigService } from './config.service.js';
import { CreateAppointmentSlotDto } from './dto/create-appointment-slot.dto.js';
import { UpdateAppointmentSlotDto } from './dto/update-appointment-slot.dto.js';
import { CreateWorkflowNodeDto } from './dto/create-workflow-node.dto.js';
import { UpdateWorkflowNodeDto } from './dto/update-workflow-node.dto.js';

@Controller('config')
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  @Get('appointment-slots')
  findAllSlots() {
    return this.configService.findAllSlots();
  }

  @Get('appointment-slots/:id')
  findOneSlot(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findOneSlot(id);
  }

  @Post('appointment-slots')
  createSlot(@Body() dto: CreateAppointmentSlotDto) {
    return this.configService.createSlot(dto);
  }

  @Put('appointment-slots/:id')
  updateSlot(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAppointmentSlotDto) {
    return this.configService.updateSlot(id, dto);
  }

  @Delete('appointment-slots/:id')
  removeSlot(@Param('id', ParseIntPipe) id: number) {
    return this.configService.removeSlot(id);
  }

  @Get('workflow-nodes')
  findAllWorkflowNodes() {
    return this.configService.findAllWorkflowNodes();
  }

  @Get('workflow-nodes/:id')
  findOneWorkflowNode(@Param('id', ParseIntPipe) id: number) {
    return this.configService.findOneWorkflowNode(id);
  }

  @Post('workflow-nodes')
  createWorkflowNode(@Body() dto: CreateWorkflowNodeDto) {
    return this.configService.createWorkflowNode(dto);
  }

  @Put('workflow-nodes/:id')
  updateWorkflowNode(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWorkflowNodeDto) {
    return this.configService.updateWorkflowNode(id, dto);
  }

  @Delete('workflow-nodes/:id')
  removeWorkflowNode(@Param('id', ParseIntPipe) id: number) {
    return this.configService.removeWorkflowNode(id);
  }
}
