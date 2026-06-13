import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { FollowUpService } from '../services/follow-up.service';
import { CreateFollowUpTaskDto, UpdateFollowUpTaskDto } from '../dto/follow-up.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('follow-ups')
export class FollowUpController {
  constructor(private readonly followUpService: FollowUpService) {}

  @Post()
  @RequiresPermission('followup:create')
  async create(
    @Body() dto: CreateFollowUpTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.followUpService.create(dto, user);
  }

  @Get()
  @RequiresPermission('followup:view')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('patientId') patientId?: string,
    @Query('doctorId') doctorId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.followUpService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      patientId,
      doctorId,
      status,
      type,
      startDate,
      endDate,
    });
  }

  @Get('count')
  @RequiresPermission('followup:view')
  async getPendingCount(@CurrentUser() user: CurrentUserPayload) {
    return this.followUpService.getPendingCount(user.clinicId);
  }

  @Get(':id')
  @RequiresPermission('followup:view')
  async findOne(@Param('id') id: string) {
    return this.followUpService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('followup:handle')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.followUpService.update(id, dto, user);
  }

  @Put(':id/complete')
  @RequiresPermission('followup:handle')
  async complete(
    @Param('id') id: string,
    @Body() dto: { result: string; feedback?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.followUpService.complete(id, dto, user);
  }
}
