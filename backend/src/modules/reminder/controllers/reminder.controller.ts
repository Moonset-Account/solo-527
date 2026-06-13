import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ReminderService } from '../services/reminder.service';
import { CreateReminderTaskDto, UpdateReminderTaskDto } from '../dto/reminder.dto';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { RequiresPermission } from '../../../common/decorators/requires-permission.decorator';

@Controller('reminders')
export class ReminderController {
  constructor(private readonly reminderService: ReminderService) {}

  @Post()
  @RequiresPermission('reminder:create')
  async create(
    @Body() dto: CreateReminderTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reminderService.create(dto, user);
  }

  @Get()
  @RequiresPermission('reminder:view')
  async findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assignedToId') assignedToId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.reminderService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      clinicId: user?.clinicId,
      type,
      status,
      priority,
      assignedToId,
    });
  }

  @Get('count')
  @RequiresPermission('reminder:view')
  async getPendingCount(@CurrentUser() user: CurrentUserPayload) {
    return this.reminderService.getPendingCount(user.clinicId);
  }

  @Get(':id')
  @RequiresPermission('reminder:view')
  async findOne(@Param('id') id: string) {
    return this.reminderService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission('reminder:handle')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReminderTaskDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.reminderService.update(id, dto, user);
  }
}
