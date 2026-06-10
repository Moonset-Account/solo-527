import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not } from 'typeorm';
import { ConstructionStage } from './construction-stage.entity';
import { CreateConstructionStageDto } from './dto/create-construction-stage.dto';
import { UpdateConstructionStageDto } from './dto/update-construction-stage.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { ConstructionStageStatus } from '../common/enums/construction-stage-status.enum';
import { DelayReminderService } from '../delay-reminder/delay-reminder.service';

@Injectable()
export class ConstructionStageService {
  constructor(
    @InjectRepository(ConstructionStage)
    private constructionStageRepository: Repository<ConstructionStage>,
    private delayReminderService: DelayReminderService,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number): Promise<PaginatedResult<ConstructionStage>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }

    const [list, total] = await this.constructionStageRepository.findAndCount({
      where,
      relations: ['project'],
      skip,
      take: pageSize,
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<ConstructionStage> {
    const stage = await this.constructionStageRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!stage) {
      throw new NotFoundException(`ConstructionStage with id ${id} not found`);
    }
    return stage;
  }

  async findByProjectId(projectId: number): Promise<ConstructionStage[]> {
    return this.constructionStageRepository.find({
      where: { projectId },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateConstructionStageDto): Promise<ConstructionStage> {
    const stage = this.constructionStageRepository.create({
      ...createDto,
      handleTime: new Date(),
    });
    return this.constructionStageRepository.save(stage);
  }

  async update(id: number, updateDto: UpdateConstructionStageDto): Promise<ConstructionStage> {
    const stage = await this.findOne(id);
    Object.assign(stage, updateDto, { handleTime: new Date() });
    const updated = await this.constructionStageRepository.save(stage);
    
    await this.checkAndCreateDelayReminder(updated);
    
    return updated;
  }

  async remove(id: number): Promise<void> {
    const result = await this.constructionStageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ConstructionStage with id ${id} not found`);
    }
  }

  private async checkAndCreateDelayReminder(stage: ConstructionStage): Promise<void> {
    if (stage.status !== ConstructionStageStatus.COMPLETED && stage.endDate) {
      const today = new Date().toISOString().split('T')[0];
      if (stage.endDate < today) {
        const days = Math.ceil(
          (new Date(today).getTime() - new Date(stage.endDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        await this.delayReminderService.createIfNotExists({
          projectId: stage.projectId,
          stageId: stage.id,
          reason: '施工阶段预计完成日期已过但未完成',
          days,
        });
      }
    }
  }

  async checkDelayedStages(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const delayedStages = await this.constructionStageRepository.find({
      where: {
        status: Not(ConstructionStageStatus.COMPLETED),
        endDate: LessThan(today),
      },
    });

    for (const stage of delayedStages) {
      const days = Math.ceil(
        (new Date(today).getTime() - new Date(stage.endDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      await this.delayReminderService.createIfNotExists({
        projectId: stage.projectId,
        stageId: stage.id,
        reason: '施工阶段预计完成日期已过但未完成',
        days,
      });
    }
  }
}
