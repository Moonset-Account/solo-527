import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Todo } from './entities/todo.entity';
import { CreateTodoDto, UpdateTodoDto, QueryTodoDto } from './dto/todo.dto';

@Injectable()
export class TodoService {
  constructor(
    @InjectRepository(Todo)
    private todoRepository: Repository<Todo>,
  ) {}

  async create(createTodoDto: CreateTodoDto): Promise<Todo> {
    const todo = this.todoRepository.create({
      ...createTodoDto,
      status: 'pending',
    });
    return this.todoRepository.save(todo);
  }

  async findAll(query?: QueryTodoDto): Promise<Todo[]> {
    const where: any = { deleted: false };
    
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;
    if (query?.affectsHelpProgress !== undefined) where.affectsHelpProgress = query.affectsHelpProgress;

    return this.todoRepository.find({
      where,
      relations: ['assignee', 'creator'],
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Todo> {
    const todo = await this.todoRepository.findOne({
      where: { id, deleted: false },
      relations: ['assignee', 'creator'],
    });
    if (!todo) {
      throw new NotFoundException('待办不存在');
    }
    return todo;
  }

  async update(id: string, updateTodoDto: UpdateTodoDto): Promise<Todo> {
    const todo = await this.findOne(id);
    Object.assign(todo, updateTodoDto);
    return this.todoRepository.save(todo);
  }

  async remove(id: string): Promise<void> {
    const todo = await this.findOne(id);
    todo.deleted = true;
    await this.todoRepository.save(todo);
  }

  async getTodoStats(): Promise<any> {
    const types = ['voting_exception', 'review', 'follow_up', 'urgent'];
    const statuses = ['pending', 'processing', 'completed'];
    const stats: any = {};

    for (const type of types) {
      stats[type] = await this.todoRepository.count({
        where: { type, deleted: false },
      });
    }

    for (const status of statuses) {
      stats[status] = await this.todoRepository.count({
        where: { status, deleted: false },
      });
    }

    stats.affectsHelpProgress = await this.todoRepository.count({
      where: { affectsHelpProgress: true, deleted: false, status: Not('completed') },
    });

    return stats;
  }
}
