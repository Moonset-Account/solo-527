import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, type PipelineStage } from 'mongoose';
import { LogService } from '../log/log.service.js';
import type { IReview, ReviewConclusion } from '../../common/types/index.js';
import type { IItem, IDepartment } from '../../common/types/index.js';

export interface FindAllQuery {
  page?: number;
  pageSize?: number;
  itemId?: string;
  conclusion?: ReviewConclusion;
}

export interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  totalItems: number;
  overdueItems: number;
  closedItems: number;
  closureRate: number;
}

export interface OverdueTrendItem {
  period: string;
  totalItems: number;
  overdueItems: number;
  overdueRate: number;
}

export interface StatisticsResult {
  departmentStats: DepartmentStat[];
  overdueTrend: OverdueTrendItem[];
}

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel('Review') private readonly reviewModel: Model<IReview>,
    @InjectModel('Item') private readonly itemModel: Model<IItem>,
    @InjectModel('Department') private readonly departmentModel: Model<IDepartment>,
    private readonly logService: LogService,
  ) {}

  async findAll(query: FindAllQuery): Promise<PaginatedResult<IReview>> {
    const { page = 1, pageSize = 10, itemId, conclusion } = query;
    const filter: Record<string, any> = {};

    if (itemId) {
      filter.itemId = new Types.ObjectId(itemId);
    }
    if (conclusion) {
      filter.conclusion = conclusion;
    }

    const [list, total] = await Promise.all([
      this.reviewModel.find(filter)
        .populate('itemId', 'title status')
        .populate('operator', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
    };
  }

  async create(
    itemId: string,
    conclusion: ReviewConclusion,
    remark: string,
    operatorId: Types.ObjectId | string,
  ): Promise<IReview> {
    const itemObjId = new Types.ObjectId(itemId);
    const item = await this.itemModel.findById(itemObjId).exec();

    if (!item) {
      throw new NotFoundException('事项不存在');
    }

    const existingReview = await this.reviewModel.findOne({ itemId: itemObjId }).exec();
    if (existingReview) {
      throw new BadRequestException('该事项已存在复盘记录');
    }

    const review = new this.reviewModel({
      itemId: itemObjId,
      conclusion,
      remark,
      operator: operatorId,
    });

    const savedReview = await review.save();

    await this.logService.create(
      'review',
      operatorId,
      itemObjId,
      'review',
      null,
      { conclusion, remark },
    );

    return savedReview;
  }

  async update(
    id: string,
    conclusion: ReviewConclusion | undefined,
    remark: string | undefined,
    operatorId: Types.ObjectId | string,
  ): Promise<IReview> {
    const reviewId = new Types.ObjectId(id);
    const review = await this.reviewModel.findById(reviewId).exec();

    if (!review) {
      throw new NotFoundException('复盘记录不存在');
    }

    const oldConclusion = review.conclusion;
    const oldRemark = review.remark;

    const updateData: Record<string, any> = {};
    if (conclusion !== undefined) {
      updateData.conclusion = conclusion;
    }
    if (remark !== undefined) {
      updateData.remark = remark;
    }

    const updatedReview = await this.reviewModel.findByIdAndUpdate(
      reviewId,
      { $set: updateData },
      { new: true },
    ).exec();

    if (conclusion !== undefined && oldConclusion !== conclusion) {
      await this.logService.create(
        'review',
        operatorId,
        review.itemId,
        'conclusion',
        oldConclusion,
        conclusion,
      );
    }

    if (remark !== undefined && oldRemark !== remark) {
      await this.logService.create(
        'review',
        operatorId,
        review.itemId,
        'remark',
        oldRemark,
        remark,
      );
    }

    return updatedReview!;
  }

  async getStatistics(
    department?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<StatisticsResult> {
    const matchFilter: Record<string, any> = {};

    if (department) {
      matchFilter.department = new Types.ObjectId(department);
    }

    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) {
        matchFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchFilter.createdAt.$lte = new Date(endDate);
      }
    }

    const departmentStats = await this.getDepartmentStats(matchFilter);
    const overdueTrend = await this.getOverdueTrend(matchFilter);

    return {
      departmentStats,
      overdueTrend,
    };
  }

  private async getDepartmentStats(matchFilter: Record<string, any>): Promise<DepartmentStat[]> {
    const pipeline: PipelineStage[] = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo',
        },
      },
      { $unwind: '$departmentInfo' },
      {
        $group: {
          _id: '$department',
          departmentName: { $first: '$departmentInfo.name' },
          totalItems: { $sum: 1 },
          overdueItems: {
            $sum: {
              $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0],
            },
          },
          closedItems: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          departmentId: { $toString: '$_id' },
          departmentName: 1,
          totalItems: 1,
          overdueItems: 1,
          closedItems: 1,
          closureRate: {
            $cond: [
              { $eq: ['$totalItems', 0] },
              0,
              { $divide: ['$closedItems', '$totalItems'] },
            ],
          },
        },
      },
      { $sort: { departmentName: 1 } },
    ];

    const result = await this.itemModel.aggregate(pipeline).exec();

    return result as DepartmentStat[];
  }

  private async getOverdueTrend(matchFilter: Record<string, any>): Promise<OverdueTrendItem[]> {
    const pipeline: PipelineStage[] = [
      { $match: matchFilter },
      {
        $project: {
          status: 1,
          deadline: 1,
          createdAt: 1,
          yearMonth: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' },
          },
          yearWeek: {
            $dateToString: { format: '%Y-%W', date: '$createdAt' },
          },
        },
      },
      {
        $facet: {
          byMonth: [
            {
              $group: {
                _id: '$yearMonth',
                totalItems: { $sum: 1 },
                overdueItems: {
                  $sum: {
                    $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                period: '$_id',
                totalItems: 1,
                overdueItems: 1,
                overdueRate: {
                  $cond: [
                    { $eq: ['$totalItems', 0] },
                    0,
                    { $divide: ['$overdueItems', '$totalItems'] },
                  ],
                },
              },
            },
            { $sort: { period: 1 } },
          ],
        },
      },
      { $unwind: '$byMonth' },
      { $replaceRoot: { newRoot: '$byMonth' } },
    ];

    const result = await this.itemModel.aggregate(pipeline).exec();

    return result as OverdueTrendItem[];
  }
}
