import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PrescriptionService } from '../services/prescription.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from '../dto/prescription.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('prescriptions')
export class PrescriptionController {
  constructor(private readonly prescriptionService: PrescriptionService) {}

  @Post()
  @RequiresPermission('prescription:create')
  async create(
    @Body() dto: CreatePrescriptionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescriptionService.create(dto, user);
  }

  @Get()
  @RequiresPermission('prescription:view')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.prescriptionService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      patientId,
      doctorId,
      status,
    });
  }

  @Get(':id')
  @RequiresPermission('prescription:view')
  async findOne(@Param('id') id: string) {
    return this.prescriptionService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('prescription:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePrescriptionDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.prescriptionService.update(id, dto, user);
  }
}
