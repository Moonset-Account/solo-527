import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from './feedback.entity.js';
import { CreateFeedbackDto, FeedbackFilterDto } from './dto.js';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private feedbackRepo: Repository<Feedback>,
  ) {}

  async create(customerId: string, dto: CreateFeedbackDto) {
    const feedback = this.feedbackRepo.create({ ...dto, customerId });
    return this.feedbackRepo.save(feedback);
  }

  async findAll(filters: FeedbackFilterDto) {
    const qb = this.feedbackRepo.createQueryBuilder('f')
      .leftJoinAndSelect('f.project', 'project')
      .leftJoinAndSelect('f.customer', 'customer');

    if (filters.projectId) qb.andWhere('f.project_id = :projectId', { projectId: filters.projectId });
    if (filters.customerId) qb.andWhere('f.customer_id = :customerId', { customerId: filters.customerId });
    if (filters.stage) qb.andWhere('f.stage = :stage', { stage: filters.stage });
    if (filters.startDate) qb.andWhere('f.created_at >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('f.created_at <= :endDate', { endDate: filters.endDate });

    return qb.orderBy('f.created_at', 'DESC').getMany();
  }

  async findAllForExport(filters: FeedbackFilterDto) {
    return this.findAll(filters);
  }
}
