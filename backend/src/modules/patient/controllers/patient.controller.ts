import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { PatientService } from '../services/patient.service';
import { CreatePatientDto, UpdatePatientDto } from '../dto/patient.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @RequiresPermission('patient:create')
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.create(dto, user);
  }

  @Get()
  @RequiresPermission('patient:view')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('keyword') keyword?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.patientService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      keyword,
    });
  }

  @Get(':id')
  @RequiresPermission('patient:view')
  async findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('patient:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.update(id, dto, user);
  }

  @Get('phone/:phone')
  @RequiresPermission('patient:view')
  async findByPhone(
    @Param('phone') phone: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.patientService.findByPhone(phone, user.clinicId);
  }
}
