import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DesignPlan } from './design-plan.entity';
import { CreateDesignPlanDto } from './dto/create-design-plan.dto';
import { UpdateDesignPlanDto } from './dto/update-design-plan.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class DesignPlanService {
  constructor(
    @InjectRepository(DesignPlan)
    private designPlanRepository: Repository<DesignPlan>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number): Promise<PaginatedResult<DesignPlan>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const [list, total] = await this.designPlanRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<DesignPlan> {
    const designPlan = await this.designPlanRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!designPlan) {
      throw new NotFoundException(`DesignPlan with id ${id} not found`);
    }
    return designPlan;
  }

  async findByProjectId(projectId: number): Promise<DesignPlan[]> {
    return this.designPlanRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDesignPlanDto: CreateDesignPlanDto): Promise<DesignPlan> {
    const designPlan = this.designPlanRepository.create({
      ...createDesignPlanDto,
      handleTime: new Date(),
    });
    return this.designPlanRepository.save(designPlan);
  }

  async update(id: number, updateDesignPlanDto: UpdateDesignPlanDto): Promise<DesignPlan> {
    const designPlan = await this.findOne(id);
    Object.assign(designPlan, updateDesignPlanDto, { handleTime: new Date() });
    return this.designPlanRepository.save(designPlan);
  }

  async remove(id: number): Promise<void> {
    const result = await this.designPlanRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`DesignPlan with id ${id} not found`);
    }
  }
}
