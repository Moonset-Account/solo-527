import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { InspectionTaskService } from './inspection-task.service';
import { CreateInspectionTaskDto } from './dto/create-inspection-task.dto';
import { UpdateInspectionTaskDto } from './dto/update-inspection-task.dto';
import { CompleteInspectionTaskDto } from './dto/complete-inspection-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('inspection-tasks')
export class InspectionTaskController {
  constructor(private readonly inspectionTaskService: InspectionTaskService) {}

  @Get()
  findAll(
    @Query() paginationDto: PaginationDto,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
  ) {
    const projectIdNum = projectId ? parseInt(projectId, 10) : undefined;
    return this.inspectionTaskService.findAll(paginationDto, projectIdNum, status);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionTaskService.findOne(id);
  }

  @Get('project/:projectId')
  findByProjectId(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.inspectionTaskService.findByProjectId(projectId);
  }

  @Post()
  create(@Body() createDto: CreateInspectionTaskDto) {
    return this.inspectionTaskService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateInspectionTaskDto) {
    return this.inspectionTaskService.update(id, updateDto);
  }

  @Patch(':id/complete')
  complete(@Param('id', ParseIntPipe) id: number, @Body() completeDto: CompleteInspectionTaskDto) {
    return this.inspectionTaskService.complete(id, completeDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.inspectionTaskService.remove(id);
  }
}
