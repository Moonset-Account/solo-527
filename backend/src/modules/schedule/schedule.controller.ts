import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  create(@Body() createScheduleDto: any, @CurrentUser('_id') userId: string) {
    return this.scheduleService.create(createScheduleDto, userId);
  }

  @Post('batch')
  batchCreate(@Body() schedules: any[], @CurrentUser('_id') userId: string) {
    return this.scheduleService.batchCreate(schedules, userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.scheduleService.findAll(query);
  }

  @Get('technician/:technicianId/week')
  getWeekSchedule(
    @Param('technicianId') technicianId: string,
    @Query('weekStart') weekStart: string,
  ) {
    return this.scheduleService.getWeekSchedule(technicianId, weekStart);
  }

  @Get('technician/:technicianId/range')
  findByTechnicianAndDateRange(
    @Param('technicianId') technicianId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.scheduleService.findByTechnicianAndDateRange(technicianId, startDate, endDate);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.scheduleService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: any,
    @CurrentUser('_id') userId: string,
  ) {
    return this.scheduleService.update(id, updateScheduleDto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.scheduleService.remove(id);
  }
}
