import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { OperationService } from './operation.service';
import {
  QueryPlatformAccountDto,
  CreatePlatformAccountDto,
  UpdatePlatformAccountDto,
  QueryMaterialDto,
  CreateMaterialDto,
  UpdateMaterialDto,
  QueryScheduleDto,
  CreateScheduleDto,
  UpdateScheduleDto,
} from './dto/operation.dto';

@Controller('operation')
export class OperationController {
  constructor(private readonly operationService: OperationService) {}

  @Post('platform-accounts')
  createPlatformAccount(@Body() dto: CreatePlatformAccountDto) {
    return this.operationService.createPlatformAccount(dto);
  }

  @Get('platform-accounts')
  findAllPlatformAccounts(@Query() query: QueryPlatformAccountDto) {
    return this.operationService.findAllPlatformAccounts(query);
  }

  @Get('platform-accounts/:id')
  findOnePlatformAccount(@Param('id') id: string) {
    return this.operationService.findOnePlatformAccount(id);
  }

  @Put('platform-accounts/:id')
  updatePlatformAccount(@Param('id') id: string, @Body() dto: UpdatePlatformAccountDto) {
    return this.operationService.updatePlatformAccount(id, dto);
  }

  @Delete('platform-accounts/:id')
  removePlatformAccount(@Param('id') id: string) {
    return this.operationService.removePlatformAccount(id);
  }

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.operationService.createMaterial(dto);
  }

  @Get('materials')
  findAllMaterials(@Query() query: QueryMaterialDto) {
    return this.operationService.findAllMaterials(query);
  }

  @Get('materials/:id')
  findOneMaterial(@Param('id') id: string) {
    return this.operationService.findOneMaterial(id);
  }

  @Put('materials/:id')
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.operationService.updateMaterial(id, dto);
  }

  @Delete('materials/:id')
  removeMaterial(@Param('id') id: string) {
    return this.operationService.removeMaterial(id);
  }

  @Post('schedules')
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.operationService.createSchedule(dto);
  }

  @Get('schedules')
  findAllSchedules(@Query() query: QueryScheduleDto) {
    return this.operationService.findAllSchedules(query);
  }

  @Get('schedules/:id')
  findOneSchedule(@Param('id') id: string) {
    return this.operationService.findOneSchedule(id);
  }

  @Put('schedules/:id')
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.operationService.updateSchedule(id, dto);
  }

  @Delete('schedules/:id')
  removeSchedule(@Param('id') id: string) {
    return this.operationService.removeSchedule(id);
  }
}
