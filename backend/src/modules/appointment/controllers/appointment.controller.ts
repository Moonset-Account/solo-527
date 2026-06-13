import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { AppointmentService } from '../services/appointment.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentListQueryDto } from '../dto/appointment.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @RequiresPermission('appointment:create')
  async create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentService.create(dto, user);
  }

  @Get()
  @RequiresPermission('appointment:view')
  async findAll(
    @Query() query: AppointmentListQueryDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.appointmentService.findAll(query, user?.clinicId);
  }

  @Get(':id')
  @RequiresPermission('appointment:view')
  async findOne(@Param('id') id: string) {
    return this.appointmentService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('appointment:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentService.update(id, dto, user);
  }

  @Put(':id/check-in')
  @RequiresPermission('appointment:update')
  async checkIn(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.appointmentService.checkIn(id, user);
  }
}
