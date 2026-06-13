import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Feedback } from './feedback.entity.js';
import { CreateFeedbackDto, FeedbackFilterDto, FeedbackStatsDto } from './dto.js';

export interface FeedbackStats {
  totalCount: number;
  averageRating: number;
  averageQualityRating: number;
  averageServiceRating: number;
  averageScheduleRating: number;
  averageCommunicationRating: number;
  averageCostRating: number;
  ratingDistribution: { rating: number; count: number }[];
  stageDistribution: { stage: string; count: number; avgRating: number }[];
  wouldRecommendCount: number;
  wouldRecommendRate: number;
}

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

  async findAll(filters: FeedbackFilterDto, companyId?: string) {
    const qb = this.feedbackRepo.createQueryBuilder('f')
      .leftJoinAndSelect('f.project', 'project')
      .leftJoinAndSelect('f.customer', 'customer');

    if (companyId) {
      qb.andWhere('project.company_id = :companyId', { companyId });
    }
    if (filters.projectId) qb.andWhere('f.project_id = :projectId', { projectId: filters.projectId });
    if (filters.customerId) qb.andWhere('f.customer_id = :customerId', { customerId: filters.customerId });
    if (filters.stage) qb.andWhere('f.stage = :stage', { stage: filters.stage });
    if (filters.minRating) qb.andWhere('f.rating >= :minRating', { minRating: filters.minRating });
    if (filters.startDate) qb.andWhere('f.created_at >= :startDate', { startDate: filters.startDate });
    if (filters.endDate) qb.andWhere('f.created_at <= :endDate', { endDate: filters.endDate });

    return qb.orderBy('f.created_at', 'DESC').getMany();
  }

  async findAllForExport(filters: FeedbackFilterDto, companyId?: string) {
    return this.findAll(filters, companyId);
  }

  async getStats(dto: FeedbackStatsDto, companyId: string): Promise<FeedbackStats> {
    const whereConditions: any = {};
    if (dto.startDate && dto.endDate) {
      whereConditions.createdAt = Between(new Date(dto.startDate), new Date(dto.endDate));
    }

    const qb = this.feedbackRepo.createQueryBuilder('f')
      .leftJoin('f.project', 'project')
      .where('project.company_id = :companyId', { companyId });

    if (dto.startDate) qb.andWhere('f.created_at >= :startDate', { startDate: dto.startDate });
    if (dto.endDate) qb.andWhere('f.created_at <= :endDate', { endDate: dto.endDate });

    const feedbacks = await qb.getMany();
    const totalCount = feedbacks.length;

    if (totalCount === 0) {
      return {
        totalCount: 0,
        averageRating: 0,
        averageQualityRating: 0,
        averageServiceRating: 0,
        averageScheduleRating: 0,
        averageCommunicationRating: 0,
        averageCostRating: 0,
        ratingDistribution: [1, 2, 3, 4, 5].map(r => ({ rating: r, count: 0 })),
        stageDistribution: [],
        wouldRecommendCount: 0,
        wouldRecommendRate: 0,
      };
    }

    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter(v => v !== null && v !== undefined) as number[];
      if (valid.length === 0) return 0;
      return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length * 10) / 10;
    };

    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: feedbacks.filter(f => f.rating === rating).length,
    }));

    const stageMap = new Map<string, { count: number; total: number }>();
    feedbacks.forEach(f => {
      const existing = stageMap.get(f.stage) || { count: 0, total: 0 };
      stageMap.set(f.stage, {
        count: existing.count + 1,
        total: existing.total + f.rating,
      });
    });

    const stageDistribution = Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      avgRating: Math.round(data.total / data.count * 10) / 10,
    }));

    const wouldRecommendCount = feedbacks.filter(f => f.wouldRecommend === true).length;
    const wouldRecommendTotal = feedbacks.filter(f => f.wouldRecommend !== null && f.wouldRecommend !== undefined).length;

    return {
      totalCount,
      averageRating: avg(feedbacks.map(f => f.rating)),
      averageQualityRating: avg(feedbacks.map(f => f.qualityRating)),
      averageServiceRating: avg(feedbacks.map(f => f.serviceRating)),
      averageScheduleRating: avg(feedbacks.map(f => f.scheduleRating)),
      averageCommunicationRating: avg(feedbacks.map(f => f.communicationRating)),
      averageCostRating: avg(feedbacks.map(f => f.costRating)),
      ratingDistribution,
      stageDistribution,
      wouldRecommendCount,
      wouldRecommendRate: wouldRecommendTotal > 0 ? Math.round(wouldRecommendCount / wouldRecommendTotal * 100) / 100 : 0,
    };
  }
}
