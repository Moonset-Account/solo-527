import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InspectionTasksService } from './inspection-tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('inspection-tasks')
@UseGuards(JwtAuthGuard)
export class InspectionTasksController {
  constructor(private tasksService: InspectionTasksService) {}

  @Get()
  async findAll(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
    @Query('assignee') assignee?: string,
    @Query('all') all?: string,
  ) {
    if (all === 'true') {
      return this.tasksService.findAllNoPagination(status, assignee);
    }
    return this.tasksService.findAll(pagination, status, assignee);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.create(createDto, user);
  }

  @Post('generate/:templateId')
  async generateFromTemplate(
    @Param('templateId') templateId: string,
    @Body() body: { assignee: string },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.generateFromTemplate(templateId, body.assignee, user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateTaskDto, @CurrentUser() user: any) {
    return this.tasksService.update(id, updateDto, user);
  }

  @Patch(':id/complete')
  async complete(
    @Param('id') id: string,
    @Body() body: { results: Record<string, any>; notes: string },
    @CurrentUser() user: any,
  ) {
    return this.tasksService.complete(id, body.results, body.notes, user);
  }
}
