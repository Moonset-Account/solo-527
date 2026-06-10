import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('checkin')
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('from-appointment')
  createFromAppointment(
    @Body() body: { appointment: any },
    @CurrentUser('_id') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.checkinService.createFromAppointment(body.appointment, userId, userName);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.checkinService.findAll(query);
  }

  @Get('today/count')
  getTodayCheckinCount() {
    return this.checkinService.getTodayCheckinCount();
  }

  @Get('today/stats')
  getTodayStats() {
    return this.checkinService.getTodayStats();
  }

  @Get('appointment/:appointmentId')
  findByAppointmentId(@Param('appointmentId') appointmentId: string) {
    return this.checkinService.findByAppointmentId(appointmentId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.checkinService.findById(id);
  }

  @Patch(':id/checkin')
  checkin(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.checkinService.checkin(id, userId);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @Body() completeData: any,
    @CurrentUser('_id') userId: string,
    @CurrentUser('name') userName: string,
  ) {
    return this.checkinService.complete(id, completeData, userId, userName);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.checkinService.cancel(id, userId);
  }
}
