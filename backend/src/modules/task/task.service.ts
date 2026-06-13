import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: 'pending',
    });
    return this.taskRepository.save(task);
  }

  async findAll(query?: QueryTaskDto): Promise<Task[]> {
    const where: any = { deleted: false };
    
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;
    if (query?.eventId) where.eventId = query.eventId;
    
    if (query?.startDate && query?.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    return this.taskRepository.find({
      where,
      relations: ['assignee', 'creator', 'event'],
      order: { createdAt: 'DESC', deadline: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id, deleted: false },
      relations: ['assignee', 'creator', 'event'],
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    
    if (updateTaskDto.status === 'completed' && task.status !== 'completed') {
      updateTaskDto.endTime = new Date().toISOString();
    }
    if (updateTaskDto.status === 'in_progress' && task.status === 'pending') {
      updateTaskDto.startTime = new Date().toISOString();
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    task.deleted = true;
    await this.taskRepository.save(task);
  }

  async getTaskStats(): Promise<any> {
    const types = ['rectification', 'patrol', 'review'] as const;
    const statuses = ['pending', 'in_progress', 'completed', 'cancelled'] as const;
    const stats: any = {};

    for (const type of types) {
      stats[type] = await this.taskRepository.count({
        where: { type: type as any, deleted: false },
      });
    }

    for (const status of statuses) {
      stats[status] = await this.taskRepository.count({
        where: { status: status as any, deleted: false },
      });
    }

    return stats;
  }
}
