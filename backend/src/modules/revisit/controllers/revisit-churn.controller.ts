import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { RevisitChurnService } from '../services/revisit-churn.service';
import { CreateRevisitChurnDto, UpdateRevisitChurnDto, CloseRevisitChurnDto } from '../dto/revisit-churn.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('revisit-churns')
export class RevisitChurnController {
  constructor(private readonly revisitChurnService: RevisitChurnService) {}

  @Post()
  @RequiresPermission('revisit:create')
  async create(
    @Body() dto: CreateRevisitChurnDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.revisitChurnService.create(dto, user);
  }

  @Get()
  @RequiresPermission('revisit:view')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('patientId') patientId?: string,
    @Query('status') status?: string,
    @Query('churnType') churnType?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('isClosed') isClosed?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.revisitChurnService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      patientId,
      status,
      churnType,
      assignedToId,
      isClosed: isClosed !== undefined ? isClosed === 'true' : undefined,
      startDate,
      endDate,
    });
  }

  @Get('stats')
  @RequiresPermission('revisit:view')
  async getStats(@CurrentUser() user: CurrentUserPayload) {
    return this.revisitChurnService.getStats(user.clinicId);
  }

  @Get(':id')
  @RequiresPermission('revisit:view')
  async findOne(@Param('id') id: string) {
    return this.revisitChurnService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('revisit:handle')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRevisitChurnDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.revisitChurnService.update(id, dto, user);
  }

  @Put(':id/handle')
  @RequiresPermission('revisit:handle')
  async handle(
    @Param('id') id: string,
    @Body() dto: { handleResult: string; handleNotes?: string },
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.revisitChurnService.handle(id, dto, user);
  }

  @Put(':id/close')
  @RequiresPermission('revisit:close')
  async close(
    @Param('id') id: string,
    @Body() dto: CloseRevisitChurnDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.revisitChurnService.close(id, dto, user);
  }
}
