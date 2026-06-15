import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionTask, TaskStatus } from './entities/inspection-task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { InspectionTemplatesService } from '../inspection-templates/inspection-templates.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class InspectionTasksService {
  constructor(
    @InjectRepository(InspectionTask)
    private taskRepository: Repository<InspectionTask>,
    private templatesService: InspectionTemplatesService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createDto: CreateTaskDto, user: any) {
    const task = this.taskRepository.create(createDto);
    const saved = await this.taskRepository.save(task);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'CREATE',
      entityType: 'INSPECTION_TASK',
      entityId: saved.id,
      details: { templateId: saved.templateId, assignee: saved.assignee },
    });

    return saved;
  }

  async generateFromTemplate(templateId: string, assignee: string, user: any) {
    const template = await this.templatesService.findOne(templateId);

    const task = this.taskRepository.create({
      templateId: template.id,
      templateName: template.name,
      assignee,
      status: TaskStatus.PENDING,
    });
    const saved = await this.taskRepository.save(task);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'GENERATE',
      entityType: 'INSPECTION_TASK',
      entityId: saved.id,
      details: { templateId, templateName: template.name, assignee },
    });

    return saved;
  }

  async findAll(pagination: PaginationDto, status?: string, assignee?: string) {
    const query = this.taskRepository.createQueryBuilder('task');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (assignee) {
      query.andWhere('task.assignee = :assignee', { assignee });
    }

    query.orderBy(`task.${pagination.sortBy}`, pagination.sortOrder);
    query.skip((pagination.page - 1) * pagination.limit);
    query.take(pagination.limit);

    const [items, total] = await query.getManyAndCount();
    return { data: items, total, page: pagination.page, limit: pagination.limit };
  }

  async findAllNoPagination(status?: string, assignee?: string) {
    const query = this.taskRepository.createQueryBuilder('task');

    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (assignee) {
      query.andWhere('task.assignee = :assignee', { assignee });
    }

    query.orderBy('task.createdAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: string) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Inspection task ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateDto: UpdateTaskDto, user: any) {
    const task = await this.findOne(id);
    Object.assign(task, updateDto);
    const saved = await this.taskRepository.save(task);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'UPDATE',
      entityType: 'INSPECTION_TASK',
      entityId: id,
      details: { ...updateDto },
    });

    return saved;
  }

  async complete(id: string, results: Record<string, any>, notes: string, user: any) {
    const task = await this.findOne(id);
    task.status = TaskStatus.COMPLETED;
    task.results = results;
    task.notes = notes;
    task.completedAt = new Date();

    if (!task.startedAt) {
      task.startedAt = new Date();
    }

    const saved = await this.taskRepository.save(task);

    await this.auditLogsService.createLog({
      operator: user.id,
      operatorName: user.displayName || user.username,
      action: 'COMPLETE',
      entityType: 'INSPECTION_TASK',
      entityId: id,
      details: { results, notes },
    });

    return saved;
  }
}
