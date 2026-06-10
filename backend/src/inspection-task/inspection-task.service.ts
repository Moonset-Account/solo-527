import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InspectionTask } from './inspection-task.entity';
import { CreateInspectionTaskDto } from './dto/create-inspection-task.dto';
import { UpdateInspectionTaskDto } from './dto/update-inspection-task.dto';
import { CompleteInspectionTaskDto } from './dto/complete-inspection-task.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { InspectionResult } from '../common/enums/inspection-result.enum';
import { InspectionStatus } from '../common/enums/inspection-status.enum';
import { ProjectService } from '../project/project.service';

@Injectable()
export class InspectionTaskService {
  constructor(
    @InjectRepository(InspectionTask)
    private inspectionTaskRepository: Repository<InspectionTask>,
    private projectService: ProjectService,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, status?: string): Promise<PaginatedResult<InspectionTask>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.inspectionTaskRepository.findAndCount({
      where,
      relations: ['project', 'stage'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<InspectionTask> {
    const task = await this.inspectionTaskRepository.findOne({
      where: { id },
      relations: ['project', 'stage'],
    });
    if (!task) {
      throw new NotFoundException(`InspectionTask with id ${id} not found`);
    }
    return task;
  }

  async findByProjectId(projectId: number): Promise<InspectionTask[]> {
    return this.inspectionTaskRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateInspectionTaskDto): Promise<InspectionTask> {
    const task = this.inspectionTaskRepository.create({
      ...createDto,
      handleTime: new Date(),
    });
    return this.inspectionTaskRepository.save(task);
  }

  async update(id: number, updateDto: UpdateInspectionTaskDto): Promise<InspectionTask> {
    const task = await this.findOne(id);
    Object.assign(task, updateDto, { handleTime: new Date() });
    const updated = await this.inspectionTaskRepository.save(task);

    if (updated.result === InspectionResult.FAIL) {
      await this.notifyProjectManager(updated);
    }

    return updated;
  }

  async complete(id: number, completeDto: CompleteInspectionTaskDto): Promise<InspectionTask & { needNotifyProjectManager?: boolean }> {
    const task = await this.findOne(id);
    task.result = completeDto.result;
    task.issues = completeDto.issues;
    task.rectificationDeadline = completeDto.rectificationDeadline;
    task.status = InspectionStatus.COMPLETED;
    task.handleTime = new Date();
    if (completeDto.handler) {
      task.handler = completeDto.handler;
    }

    const updated = await this.inspectionTaskRepository.save(task);
    const needNotifyProjectManager = updated.result === InspectionResult.FAIL;

    if (needNotifyProjectManager) {
      await this.notifyProjectManager(updated);
    }

    return { ...updated, needNotifyProjectManager };
  }

  async remove(id: number): Promise<void> {
    const result = await this.inspectionTaskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`InspectionTask with id ${id} not found`);
    }
  }

  private async notifyProjectManager(task: InspectionTask): Promise<void> {
    console.log(`通知项目经理：巡检任务 "${task.title}" 不合格，请及时处理。`);
  }
}
