import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { TodoService } from './todo.service';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';
import { Todo } from './entities/todo.entity';

@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto): Promise<Todo> {
    return this.todoService.create(createTodoDto);
  }

  @Get()
  findAll(@Query() query?: QueryTodoDto): Promise<Todo[]> {
    return this.todoService.findAll(query);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.todoService.getTodoStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Todo> {
    return this.todoService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTodoDto: UpdateTodoDto): Promise<Todo> {
    return this.todoService.update(id, updateTodoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.todoService.remove(id);
  }
}
