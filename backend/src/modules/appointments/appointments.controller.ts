import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  create(@Body() createAppointmentDto: any, @Req() req) {
    return this.appointmentsService.create(createAppointmentDto, req.user.userId);
  }

  @Get()
  findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
    @Query() filters: any,
  ) {
    return this.appointmentsService.findAll(page, pageSize, filters);
  }

  @Get('my')
  findMyAppointments(
    @Req() req,
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ) {
    return this.appointmentsService.findByClient(req.user.userId, page, pageSize);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAppointmentDto: any, @Req() req) {
    return this.appointmentsService.update(id, updateAppointmentDto, req.user.userId);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.confirm(id, req.user.userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() body: { reason: string; cancelledBy: string }, @Req() req) {
    return this.appointmentsService.cancel(id, body.reason, body.cancelledBy, req.user.userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @Body() body: { counselorNotes: string }, @Req() req) {
    return this.appointmentsService.complete(id, body.counselorNotes, req.user.userId);
  }

  @Post(':id/no-show')
  markNoShow(@Param('id') id: string, @Req() req) {
    return this.appointmentsService.markNoShow(id, req.user.userId);
  }

  @Post(':id/payment')
  updatePayment(@Param('id') id: string, @Body() body: any) {
    return this.appointmentsService.updatePayment(id, body.paymentStatus, body.paymentMethod, body.failureReason);
  }
}
