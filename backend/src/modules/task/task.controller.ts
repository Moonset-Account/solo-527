import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { Task } from './entities/task.entity';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.taskService.create(createTaskDto);
  }

  @Get()
  findAll(@Query() query?: QueryTaskDto): Promise<Task[]> {
    return this.taskService.findAll(query);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.taskService.getTaskStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto): Promise<Task> {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.taskService.remove(id);
  }
}
