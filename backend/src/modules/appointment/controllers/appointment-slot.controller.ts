import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { AppointmentSlotService } from '../services/appointment-slot.service';
import { CreateAppointmentSlotDto } from '../dto/appointment.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('appointment-slots')
export class AppointmentSlotController {
  constructor(private readonly slotService: AppointmentSlotService) {}

  @Post()
  @RequiresPermission('slot:manage')
  async create(
    @Body() dto: CreateAppointmentSlotDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.slotService.create(dto, user);
  }

  @Get()
  @RequiresPermission('slot:view')
  async findByDoctorAndDate(
    @Query('doctorId') doctorId: string,
    @Query('date') date: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.slotService.findByDoctorAndDate(doctorId, date, user?.clinicId);
  }

  @Get('utilization')
  @RequiresPermission('slot:view')
  async getUtilization(
    @Query('date') date: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.slotService.getSlotUtilization(date, user.clinicId);
  }

  @Get(':id')
  @RequiresPermission('slot:view')
  async findOne(@Param('id') id: string) {
    return this.slotService.findOne(id);
  }

  @Put(':id/status')
  @RequiresPermission('slot:manage')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.slotService.updateStatus(id, status, user);
  }
}
