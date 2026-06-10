import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { DelayReminderService } from './delay-reminder.service';
import { CreateDelayReminderDto } from './dto/create-delay-reminder.dto';
import { UpdateDelayReminderDto } from './dto/update-delay-reminder.dto';
import { ResolveDelayReminderDto } from './dto/resolve-delay-reminder.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('delay-reminders')
export class DelayReminderController {
  constructor(private readonly delayReminderService: DelayReminderService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.delayReminderService.findAll(paginationDto, projectIdNum, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.delayReminderService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.delayReminderService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateDelayReminderDto) {
    return this.delayReminderService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateDelayReminderDto) {
    return this.delayReminderService.update(id, updateDto);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() resolveDto: ResolveDelayReminderDto) {
    return this.delayReminderService.resolve(id, resolveDto.handler);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.delayReminderService.remove(id);
  }
}
