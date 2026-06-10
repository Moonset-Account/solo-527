import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: any, @CurrentUser('_id') userId: string) {
    return this.appointmentsService.create(createAppointmentDto, userId);
  }

  @Public()
  @Post('public')
  createPublic(@Body() createAppointmentDto: any) {
    return this.appointmentsService.create(createAppointmentDto, 'public');
  }

  @Get()
  findAll(@Query() query: any) {
    return this.appointmentsService.findAll(query);
  }

  @Get('available-slots')
  getAvailableTimeSlots(
    @Query('technicianId') technicianId: string,
    @Query('date') date: string,
    @Query('duration') duration: string,
  ) {
    return this.appointmentsService.getAvailableTimeSlots(technicianId, date, parseInt(duration, 10));
  }

  @Get('today/count')
  getTodayCount() {
    return this.appointmentsService.getTodayCount();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: any,
    @CurrentUser('_id') userId: string,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, userId);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body() rescheduleDto: any,
    @CurrentUser('_id') userId: string,
  ) {
    return this.appointmentsService.reschedule(id, rescheduleDto, userId);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.appointmentsService.cancel(id, userId);
  }

  @Patch(':id/checkin')
  checkIn(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.appointmentsService.checkIn(id, userId);
  }

  @Patch(':id/complete')
  complete(@Param('id') id: string, @CurrentUser('_id') userId: string) {
    return this.appointmentsService.complete(id, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.appointmentsService.remove(id);
  }
}
