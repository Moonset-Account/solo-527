import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity.js';
import { CreateProjectDto, UpdateProjectDto } from './dto.js';
import { Budget } from '../budget/budget.entity.js';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  async findAll(companyId: string) {
    return this.projectRepo.find({
      where: { companyId },
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: [
        'customer',
        'budgets',
        'budgets.items',
        'budgets.items.materials',
        'contracts',
        'contracts.attachments',
        'photos',
        'attachments',
      ],
      order: {
        budgets: { version: 'DESC' },
        photos: { createdAt: 'DESC' },
        attachments: { createdAt: 'DESC' },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    const projectObj: any = { ...project };
    if (project.budgets && project.budgets.length > 0) {
      projectObj.latestBudget = project.budgets[0] as Budget;
    } else {
      projectObj.latestBudget = null;
    }
    projectObj.contract = project.contracts && project.contracts.length > 0 ? project.contracts[0] : null;
    projectObj.feedbacks = [];
    projectObj.afterSaleOrders = [];
    return projectObj;
  }

  async create(companyId: string, dto: CreateProjectDto) {
    const project = this.projectRepo.create({ ...dto, companyId });
    return this.projectRepo.save(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string) {
    const project = await this.findOne(id);
    await this.projectRepo.softRemove(project);
    return { message: 'Project deleted' };
  }
}
