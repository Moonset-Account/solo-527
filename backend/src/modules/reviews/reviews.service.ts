import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Review, ReviewDocument, FollowUpStatus } from '../../schemas/review.schema';
import { Order, OrderDocument } from '../../schemas/order.schema';
import { Worker, WorkerDocument } from '../../schemas/worker.schema';
import {
  CreateReviewDto,
  QueryReviewDto,
  PendingFollowUpDto,
  FollowUpDto,
  ReplyReviewDto,
  BatchFollowUpDto,
  BatchFollowUpResult,
  ReviewStats,
} from '../../dto/review.dto';
import { createHash } from 'crypto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Worker.name) private workerModel: Model<WorkerDocument>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private generateCacheKey(prefix: string, data: Record<string, any>): string {
    const hash = createHash('md5').update(JSON.stringify(data)).digest('hex');
    return `reviews:${prefix}:${hash}`;
  }

  private clearReviewRelatedCache(): void {
    this.cacheManager.store.keys('reviews:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
    this.cacheManager.store.keys('orders:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
    this.cacheManager.store.keys('workers:*').then((keys: string[]) => {
      keys.forEach((key: string) => {
        this.cacheManager.del(key);
      });
    });
  }

  async createReview(dto: CreateReviewDto): Promise<ReviewDocument> {
    const order = await this.orderModel.findById(dto.orderId);
    if (!order) {
      throw new HttpException('订单不存在', HttpStatus.NOT_FOUND);
    }

    if (order.status !== 'completed') {
      throw new HttpException(
        `当前订单状态为 ${order.status}，仅已完成订单可评价`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (order.userId.toString() !== dto.userId.toString()) {
      throw new HttpException('仅订单所属用户可评价', HttpStatus.FORBIDDEN);
    }

    const existingReview = await this.reviewModel.findOne({ orderId: dto.orderId });
    if (existingReview) {
      throw new HttpException('该订单已评价，不可重复评价', HttpStatus.BAD_REQUEST);
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new HttpException('评分必须在 1-5 分之间', HttpStatus.BAD_REQUEST);
    }

    const review = new this.reviewModel({
      orderId: dto.orderId,
      userId: dto.userId,
      rating: dto.rating,
      tags: dto.tags || [],
      content: dto.content || '',
      followUpStatus: 'pending' as FollowUpStatus,
    });

    const savedReview = await review.save();

    if (order.workerId) {
      await this.updateWorkerRating(order.workerId);
    }

    this.clearReviewRelatedCache();
    return savedReview;
  }

  private async updateWorkerRating(workerId: Types.ObjectId): Promise<void> {
    const orders = await this.orderModel.find({ workerId, status: 'completed' });
    const orderIds = orders.map((o) => o._id);

    const reviews = await this.reviewModel.find({ orderId: { $in: orderIds } });
    if (reviews.length === 0) {
      await this.workerModel.findByIdAndUpdate(workerId, { rating: 5 });
      return;
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await this.workerModel.findByIdAndUpdate(workerId, { rating: avgRating });
  }

  async queryReviews(dto: QueryReviewDto): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || dto.limit || 20;
    const skip = (page - 1) * pageSize;

    const filter: FilterQuery<ReviewDocument> = {};

    if (dto.rating !== undefined) {
      filter.rating = dto.rating;
    } else if (dto.minRating !== undefined || dto.maxRating !== undefined) {
      filter.rating = {};
      if (dto.minRating !== undefined) {
        filter.rating.$gte = dto.minRating;
      }
      if (dto.maxRating !== undefined) {
        filter.rating.$lte = dto.maxRating;
      }
    }

    if (dto.followUpStatus) {
      filter.followUpStatus = dto.followUpStatus;
    }

    if (dto.userId) {
      filter.userId = dto.userId;
    }

    if (dto.orderId) {
      filter.orderId = dto.orderId;
    }

    const orderLookup: any = {
      from: 'orders',
      localField: 'orderId',
      foreignField: '_id',
      as: 'order',
    };

    const pipeline: any[] = [{ $match: filter }];

    if (dto.community || dto.communities || dto.workerId || dto.startTime || dto.endTime) {
      pipeline.push({ $lookup: orderLookup }, { $unwind: '$order' });

      const orderMatch: any = {};

      if (dto.community) {
        orderMatch['order.community'] = dto.community;
      } else if (dto.communities && dto.communities.length > 0) {
        orderMatch['order.community'] = { $in: dto.communities };
      }

      if (dto.workerId) {
        orderMatch['order.workerId'] = new Types.ObjectId(dto.workerId.toString());
      }

      if (dto.startTime || dto.endTime) {
        orderMatch['order.scheduledAt'] = {};
        if (dto.startTime) {
          orderMatch['order.scheduledAt'].$gte = new Date(dto.startTime);
        }
        if (dto.endTime) {
          orderMatch['order.scheduledAt'].$lte = new Date(dto.endTime);
        }
      }

      pipeline.push({ $match: orderMatch });
    }

    const cacheKey = this.generateCacheKey('list', { filter, dto, page, pageSize });
    const cached = await this.cacheManager.get<{
      list: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await this.reviewModel.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    const dataPipeline = [
      ...pipeline,
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'order',
        },
      },
      { $unwind: { path: '$order', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'workers',
          localField: 'order.workerId',
          foreignField: '_id',
          as: 'worker',
        },
      },
      { $unwind: { path: '$worker', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          orderId: 1,
          userId: 1,
          rating: 1,
          tags: 1,
          content: 1,
          reply: 1,
          followUpStatus: 1,
          followUpContent: 1,
          followUpBy: 1,
          followUpAt: 1,
          createdAt: 1,
          order: {
            _id: '$order._id',
            orderNo: '$order.orderNo',
            scheduledAt: '$order.scheduledAt',
            community: '$order.community',
            addressSnapshot: '$order.addressSnapshot',
            workerId: '$order.workerId',
          },
          worker: {
            _id: '$worker._id',
            name: '$worker.name',
            phone: '$worker.phone',
            rating: '$worker.rating',
            community: '$worker.community',
          },
        },
      },
    ];

    const list = await this.reviewModel.aggregate(dataPipeline).exec();

    const result = { list, total, page, pageSize };
    await this.cacheManager.set(cacheKey, result, 60);
    return result;
  }

  async getReviewDetail(id: Types.ObjectId): Promise<any> {
    const cacheKey = this.generateCacheKey('detail', { id: id.toString() });
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    const review = await this.reviewModel
      .findById(id)
      .populate({
        path: 'orderId',
        select: 'orderNo scheduledAt community addressSnapshot workerId',
        populate: {
          path: 'workerId',
          select: 'name phone rating community',
        },
      })
      .exec();

    if (!review) {
      throw new HttpException('评价不存在', HttpStatus.NOT_FOUND);
    }

    const result = {
      ...review.toObject(),
      order: (review as any).orderId,
    };
    delete result.orderId;

    await this.cacheManager.set(cacheKey, result, 120);
    return result;
  }

  async replyReview(id: Types.ObjectId, dto: ReplyReviewDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new HttpException('评价不存在', HttpStatus.NOT_FOUND);
    }

    if (!dto.reply || dto.reply.trim() === '') {
      throw new HttpException('回复内容不能为空', HttpStatus.BAD_REQUEST);
    }

    review.reply = dto.reply;
    const updatedReview = await review.save();

    this.clearReviewRelatedCache();
    return updatedReview;
  }

  async followUp(id: Types.ObjectId, dto: FollowUpDto): Promise<ReviewDocument> {
    const review = await this.reviewModel.findById(id);
    if (!review) {
      throw new HttpException('评价不存在', HttpStatus.NOT_FOUND);
    }

    if (review.followUpStatus === 'done') {
      throw new HttpException('该评价已完成回访，不可重复回访', HttpStatus.BAD_REQUEST);
    }

    if (!dto.followUpContent || dto.followUpContent.trim() === '') {
      throw new HttpException('回访内容不能为空', HttpStatus.BAD_REQUEST);
    }

    if (!dto.followUpBy || dto.followUpBy.trim() === '') {
      throw new HttpException('回访人不能为空', HttpStatus.BAD_REQUEST);
    }

    review.followUpStatus = 'done' as FollowUpStatus;
    review.followUpContent = dto.followUpContent;
    review.followUpBy = dto.followUpBy;
    review.followUpAt = new Date();

    const updatedReview = await review.save();

    this.clearReviewRelatedCache();
    return updatedReview;
  }

  async getPendingFollowUpList(dto: PendingFollowUpDto): Promise<{
    list: any[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const page = dto.page || 1;
    const pageSize = dto.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const cacheKey = this.generateCacheKey('pending', { page, pageSize });
    const cached = await this.cacheManager.get<{
      list: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    const [list, total] = await Promise.all([
      this.reviewModel
        .find({ followUpStatus: 'pending' as FollowUpStatus })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'orderId',
          select: 'orderNo scheduledAt community addressSnapshot workerId userId',
          populate: [
            {
              path: 'workerId',
              select: 'name phone rating community',
            },
            {
              path: 'userId',
              select: 'name phone level avatar',
            },
          ],
        })
        .lean()
        .exec(),
      this.reviewModel.countDocuments({ followUpStatus: 'pending' as FollowUpStatus }).exec(),
    ]);

    const formattedList = list.map((review: any) => ({
      ...review,
      order: review.orderId,
    }));
    formattedList.forEach((item: any) => delete item.orderId);

    const result = { list: formattedList, total, page, pageSize };
    await this.cacheManager.set(cacheKey, result, 30);
    return result;
  }

  async getStats(): Promise<ReviewStats> {
    const cacheKey = this.generateCacheKey('stats', {});
    const cached = await this.cacheManager.get<ReviewStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const [allReviews, pendingCount, doneCount] = await Promise.all([
      this.reviewModel.find().lean().exec(),
      this.reviewModel.countDocuments({ followUpStatus: 'pending' as FollowUpStatus }).exec(),
      this.reviewModel.countDocuments({ followUpStatus: 'done' as FollowUpStatus }).exec(),
    ]);

    const totalCount = allReviews.length;

    const averageRating =
      totalCount > 0
        ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
        : 0;

    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const rating = Math.floor(r.rating);
      if (rating >= 1 && rating <= 5) {
        ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const followUpRate =
      totalCount > 0 ? Math.round((doneCount / totalCount) * 10000) / 100 : 0;

    const tagMap = new Map<string, number>();
    allReviews.forEach((r) => {
      if (r.tags && Array.isArray(r.tags)) {
        r.tags.forEach((tag: string) => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tagMap.set(trimmedTag, (tagMap.get(trimmedTag) || 0) + 1);
          }
        });
      }
    });

    const tagCloud = Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 100);

    const result: ReviewStats = {
      averageRating,
      totalCount,
      ratingDistribution,
      pendingFollowUpCount: pendingCount,
      doneFollowUpCount: doneCount,
      followUpRate,
      tagCloud,
    };

    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  async batchFollowUp(dto: BatchFollowUpDto): Promise<BatchFollowUpResult> {
    if (!dto.reviewIds || dto.reviewIds.length === 0) {
      throw new HttpException('请选择要回访的评价', HttpStatus.BAD_REQUEST);
    }

    if (!dto.followUpContent || dto.followUpContent.trim() === '') {
      throw new HttpException('回访内容不能为空', HttpStatus.BAD_REQUEST);
    }

    if (!dto.followUpBy || dto.followUpBy.trim() === '') {
      throw new HttpException('回访人不能为空', HttpStatus.BAD_REQUEST);
    }

    const result: BatchFollowUpResult = {
      success: [],
      failed: [],
    };

    await Promise.all(
      dto.reviewIds.map(async (reviewId) => {
        try {
          const review = await this.reviewModel.findById(reviewId);
          if (!review) {
            result.failed.push({ id: reviewId.toString(), message: '评价不存在' });
            return;
          }

          if (review.followUpStatus === 'done') {
            result.failed.push({ id: reviewId.toString(), message: '已完成回访，不可重复回访' });
            return;
          }

          review.followUpStatus = 'done' as FollowUpStatus;
          review.followUpContent = dto.followUpContent;
          review.followUpBy = dto.followUpBy;
          review.followUpAt = new Date();

          await review.save();
          result.success.push({ id: reviewId.toString(), message: '回访成功' });
        } catch (error) {
          result.failed.push({
            id: reviewId.toString(),
            message: error.message || '回访失败',
          });
        }
      }),
    );

    this.clearReviewRelatedCache();
    return result;
  }
}
