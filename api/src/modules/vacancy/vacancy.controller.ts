import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { VacancyService } from './vacancy.service.js';
import { CreateVacancyAlertConfigDto } from './dto/create-vacancy-alert-config.dto.js';
import { UpdateVacancyAlertConfigDto } from './dto/update-vacancy-alert-config.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

@Controller('vacancy')
export class VacancyController {
  constructor(private readonly vacancyService: VacancyService) {}

  @Get('stats')
  getStats(@Query('days') days?: number) {
    return this.vacancyService.getStats(days);
  }

  @Get('alerts')
  getAlerts(@Query() query: PaginationQueryDto) {
    return this.vacancyService.getAlerts(query);
  }

  @Put('alerts/:id/read')
  readAlert(@Param('id', ParseIntPipe) id: number) {
    return this.vacancyService.readAlert(id);
  }

  @Get('alert-configs')
  findAllAlertConfigs(@Query() query: PaginationQueryDto) {
    return this.vacancyService.findAllAlertConfigs(query);
  }

  @Get('alert-configs/:id')
  findOneAlertConfig(@Param('id', ParseIntPipe) id: number) {
    return this.vacancyService.findOneAlertConfig(id);
  }

  @Post('alert-configs')
  createAlertConfig(@Body() dto: CreateVacancyAlertConfigDto) {
    return this.vacancyService.createAlertConfig(dto);
  }

  @Put('alert-configs/:id')
  updateAlertConfig(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVacancyAlertConfigDto) {
    return this.vacancyService.updateAlertConfig(id, dto);
  }

  @Delete('alert-configs/:id')
  removeAlertConfig(@Param('id', ParseIntPipe) id: number) {
    return this.vacancyService.removeAlertConfig(id);
  }
}
