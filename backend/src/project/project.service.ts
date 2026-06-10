import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { DesignPlan } from '../design-plan/design-plan.entity';
import { InspectionTask } from '../inspection-task/inspection-task.entity';
import { AfterSales } from '../after-sales/after-sales.entity';

export interface ProcessRecord {
  id: number;
  type: 'DESIGN' | 'INSPECTION' | 'AFTERSALES';
  title: string;
  status: string;
  handler: string;
  handleTime: Date;
  description?: string;
}

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    @InjectRepository(DesignPlan)
    private designPlanRepository: Repository<DesignPlan>,
    @InjectRepository(InspectionTask)
    private inspectionTaskRepository: Repository<InspectionTask>,
    @InjectRepository(AfterSales)
    private afterSalesRepository: Repository<AfterSales>,
  ) {}

  async findAll(paginationDto: PaginationDto, keyword?: string, status?: string, customerId?: number): Promise<PaginatedResult<Project>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (keyword) {
      where.name = Like(`%${keyword}%`);
    }
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const [list, total] = await this.projectRepository.findAndCount({
      where,
      relations: ['customer'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['customer'],
    });
    if (!project) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
    return project;
  }

  async findByCustomerId(customerId: number): Promise<Project[]> {
    return this.projectRepository.find({
      where: { customerId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepository.create({
      ...createProjectDto,
      handleTime: new Date(),
    });
    return this.projectRepository.save(project);
  }

  async update(id: number, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    Object.assign(project, updateProjectDto, { handleTime: new Date() });
    return this.projectRepository.save(project);
  }

  async remove(id: number): Promise<void> {
    const result = await this.projectRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Project with id ${id} not found`);
    }
  }

  async getProcessRecords(projectId: number): Promise<ProcessRecord[]> {
    const [designPlans, inspectionTasks, afterSales] = await Promise.all([
      this.designPlanRepository.find({ where: { projectId } }),
      this.inspectionTaskRepository.find({ where: { projectId } }),
      this.afterSalesRepository.find({ where: { projectId } }),
    ]);

    const records: ProcessRecord[] = [];

    designPlans.forEach((plan) => {
      records.push({
        id: plan.id,
        type: 'DESIGN',
        title: plan.name,
        status: plan.status,
        handler: plan.handler || '',
        handleTime: plan.handleTime || plan.createdAt,
        description: plan.description,
      });
    });

    inspectionTasks.forEach((task) => {
      records.push({
        id: task.id,
        type: 'INSPECTION',
        title: task.title,
        status: task.status,
        handler: task.handler || task.inspector || '',
        handleTime: task.handleTime || task.createdAt,
        description: task.issues,
      });
    });

    afterSales.forEach((sale) => {
      records.push({
        id: sale.id,
        type: 'AFTERSALES',
        title: sale.title,
        status: sale.status,
        handler: sale.handler || '',
        handleTime: sale.handleTime || sale.reportTime || sale.createdAt,
        description: sale.description,
      });
    });

    records.sort((a, b) => b.handleTime.getTime() - a.handleTime.getTime());

    return records;
  }
}
