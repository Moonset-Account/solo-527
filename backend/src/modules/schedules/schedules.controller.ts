import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query() filters: any,
  ) {
    return this.schedulesService.findAll(page, pageSize, filters);
  }

  @Get('available')
  findAvailable(
    @Query('counselorId') counselorId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.schedulesService.findAvailable(counselorId, startDate, endDate);
  }

  @Get('counselor/:counselorId/date/:date')
  findByCounselorAndDate(
    @Param('counselorId') counselorId: string,
    @Param('date') date: string,
  ) {
    return this.schedulesService.findByCounselorAndDate(counselorId, date);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createScheduleDto: any, @Req() req) {
    return this.schedulesService.create(createScheduleDto, req.user.userId);
  }

  @Post('batch')
  @UseGuards(JwtAuthGuard)
  batchCreate(@Body() batchDto: any, @Req() req) {
    return this.schedulesService.batchCreate(batchDto, req.user.userId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateScheduleDto: any, @Req() req) {
    return this.schedulesService.update(id, updateScheduleDto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req) {
    return this.schedulesService.remove(id, req.user.userId);
  }
}
