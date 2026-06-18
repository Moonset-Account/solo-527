import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './appointment.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../common/services/operation-log.service';
import { AppointmentStatusLabels } from '../../common/enums/appointment-status.enum';

@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly operationLogService: OperationLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Query('status') status?: AppointmentStatus,
    @Query('counselorId') counselorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: Appointment[]; total: number }> {
    return this.appointmentsService.findAll(
      status,
      counselorId,
      startDate,
      endDate,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('today')
  @UseGuards(JwtAuthGuard)
  getTodayAppointments(@Query('counselorId') counselorId?: string): Promise<Appointment[]> {
    return this.appointmentsService.getTodayAppointments(counselorId);
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard)
  getStatistics(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getStatistics(startDate, endDate);
  }

  @Get('workload')
  @UseGuards(JwtAuthGuard)
  getCounselorWorkload(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.appointmentsService.getCounselorWorkload(startDate, endDate);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string): Promise<Appointment | null> {
    return this.appointmentsService.findOne(id);
  }

  @Post()
  create(@Body() appointment: Partial<Appointment>): Promise<Appointment> {
    return this.appointmentsService.create(appointment);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() appointment: Partial<Appointment>,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Appointment | null> {
    const result = await this.appointmentsService.update(id, appointment, user.sub, user.name);

    this.operationLogService.log(
      user.sub,
      user.name,
      'update',
      'appointment',
      id,
      { changes: Object.keys(appointment).join(', ') },
      req.ip,
    );

    return result;
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: AppointmentStatus,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<Appointment | null> {
    const result = await this.appointmentsService.updateStatus(id, status, user.sub, user.name);

    this.operationLogService.log(
      user.sub,
      user.name,
      'status_change',
      'appointment',
      id,
      {
        oldStatus: result ? AppointmentStatusLabels[result.status] : '',
        newStatus: AppointmentStatusLabels[status],
      },
      req.ip,
    );

    return result;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Request() req: any,
  ): Promise<void> {
    await this.appointmentsService.remove(id);

    this.operationLogService.log(
      user.sub,
      user.name,
      'delete',
      'appointment',
      id,
      {},
      req.ip,
    );
  }
}
