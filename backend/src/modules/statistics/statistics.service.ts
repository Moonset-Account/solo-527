import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as dayjs from 'dayjs';
import { EmailDraft } from '../email-drafts/schemas/email-draft.schema';
import { ReviewLog } from '../review-logs/schemas/review-log.schema';
import { CallLog } from '../call-logs/schemas/call-log.schema';
import { StatisticsQueryDto } from './dto/statistics.dto';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectModel(EmailDraft.name) private emailDraftModel: Model<EmailDraft>,
    @InjectModel(ReviewLog.name) private reviewLogModel: Model<ReviewLog>,
    @InjectModel(CallLog.name) private callLogModel: Model<CallLog>,
  ) {}

  private buildBaseQuery(queryDto: StatisticsQueryDto) {
    const query: any = {};
    if (!queryDto.includeDemo) {
      query.isDemo = false;
    }
    if (queryDto.startDate || queryDto.endDate) {
      query.createdAt = {};
      if (queryDto.startDate) {
        query.createdAt.$gte = new Date(queryDto.startDate);
      }
      if (queryDto.endDate) {
        query.createdAt.$lte = new Date(queryDto.endDate);
      }
    }
    if (queryDto.createdBy) {
      query.createdBy = new Types.ObjectId(queryDto.createdBy);
    }
    return query;
  }

  async getOverview(queryDto: StatisticsQueryDto) {
    const baseQuery = this.buildBaseQuery(queryDto);

    const [totalDrafts, pendingReview, approved, rejected, sent, aiGenerated, totalReviews] =
      await Promise.all([
        this.emailDraftModel.countDocuments({ ...baseQuery }),
        this.emailDraftModel.countDocuments({ ...baseQuery, status: 'pending_review' }),
        this.emailDraftModel.countDocuments({ ...baseQuery, status: 'approved' }),
        this.emailDraftModel.countDocuments({ ...baseQuery, status: 'rejected' }),
        this.emailDraftModel.countDocuments({ ...baseQuery, status: 'sent' }),
        this.emailDraftModel.countDocuments({ ...baseQuery, aiGenerated: true }),
        this.reviewLogModel.countDocuments({
          ...baseQuery,
          ...(baseQuery.createdAt ? { createdAt: baseQuery.createdAt } : {}),
          ...(baseQuery.isDemo !== undefined ? { isDemo: baseQuery.isDemo } : {}),
        }),
      ]);

    const reviewedTotal = approved + rejected;
    const reviewRate = totalDrafts > 0 ? Number(((reviewedTotal / totalDrafts) * 100).toFixed(2)) : 0;
    const approveRate = reviewedTotal > 0 ? Number(((approved / reviewedTotal) * 100).toFixed(2)) : 0;
    const rejectRate = reviewedTotal > 0 ? Number(((rejected / reviewedTotal) * 100).toFixed(2)) : 0;
    const aiRate = totalDrafts > 0 ? Number(((aiGenerated / totalDrafts) * 100).toFixed(2)) : 0;

    return {
      totalDrafts,
      pendingReview,
      approved,
      rejected,
      sent,
      aiGenerated,
      totalReviews,
      reviewRate,
      approveRate,
      rejectRate,
      aiRate,
    };
  }

  async getByPerson(queryDto: StatisticsQueryDto) {
    const baseQuery = this.buildBaseQuery(queryDto);

    const pipeline: any[] = [
      { $match: baseQuery },
      {
        $group: {
          _id: '$createdBy',
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          username: '$user.username',
          email: '$user.email',
          total: 1,
          approved: 1,
          rejected: 1,
          pending: 1,
          sent: 1,
          aiGenerated: 1,
        },
      },
    ];

    const results = await this.emailDraftModel.aggregate(pipeline).exec();

    return results.map((item) => {
      const reviewed = item.approved + item.rejected;
      return {
        ...item,
        reviewRate: item.total > 0 ? Number(((reviewed / item.total) * 100).toFixed(2)) : 0,
        approveRate: reviewed > 0 ? Number(((item.approved / reviewed) * 100).toFixed(2)) : 0,
        rejectRate: reviewed > 0 ? Number(((item.rejected / reviewed) * 100).toFixed(2)) : 0,
        aiRate: item.total > 0 ? Number(((item.aiGenerated / item.total) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getByDate(queryDto: StatisticsQueryDto) {
    const baseQuery = this.buildBaseQuery(queryDto);

    const pipeline: any[] = [
      { $match: baseQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending_review'] }, 1, 0] } },
          sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          aiGenerated: { $sum: { $cond: ['$aiGenerated', 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.emailDraftModel.aggregate(pipeline).exec();

    return results.map((item) => {
      const reviewed = item.approved + item.rejected;
      return {
        date: item._id,
        total: item.total,
        approved: item.approved,
        rejected: item.rejected,
        pending: item.pending,
        sent: item.sent,
        aiGenerated: item.aiGenerated,
        reviewRate: item.total > 0 ? Number(((reviewed / item.total) * 100).toFixed(2)) : 0,
        approveRate: reviewed > 0 ? Number(((item.approved / reviewed) * 100).toFixed(2)) : 0,
        rejectRate: reviewed > 0 ? Number(((item.rejected / reviewed) * 100).toFixed(2)) : 0,
      };
    });
  }

  async getByLowConfidenceReason(queryDto: StatisticsQueryDto) {
    const baseQuery = this.buildBaseQuery(queryDto);
    const query = {
      ...baseQuery,
      lowConfidenceReason: { $exists: true, $ne: '' },
    };

    const pipeline: any[] = [
      { $match: query },
      {
        $group: {
          _id: '$lowConfidenceReason',
          count: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ];

    const results = await this.emailDraftModel.aggregate(pipeline).exec();
    const totalLowConfidence = results.reduce((sum, item) => sum + item.count, 0);

    return results.map((item) => ({
      reason: item._id,
      count: item.count,
      approved: item.approved,
      rejected: item.rejected,
      percentage: totalLowConfidence > 0 ? Number(((item.count / totalLowConfidence) * 100).toFixed(2)) : 0,
      approveRate: item.count > 0 ? Number(((item.approved / item.count) * 100).toFixed(2)) : 0,
      rejectRate: item.count > 0 ? Number(((item.rejected / item.count) * 100).toFixed(2)) : 0,
    }));
  }

  async getCallLogsStatistics(queryDto: StatisticsQueryDto) {
    const baseQuery = this.buildBaseQuery(queryDto);
    delete baseQuery.createdBy;

    const callQuery: any = { ...baseQuery };
    if (queryDto.createdBy) {
      callQuery.userId = new Types.ObjectId(queryDto.createdBy);
    }
    if (queryDto.startDate || queryDto.endDate) {
      callQuery.createdAt = {};
      if (queryDto.startDate) {
        callQuery.createdAt.$gte = new Date(queryDto.startDate);
      }
      if (queryDto.endDate) {
        callQuery.createdAt.$lte = new Date(queryDto.endDate);
      }
    }

    const [totalCalls, aiGenerateCalls, knowledgeSearchCalls, avgDurationResult, totalTokensResult] =
      await Promise.all([
        this.callLogModel.countDocuments(callQuery),
        this.callLogModel.countDocuments({ ...callQuery, type: 'ai_generate' }),
        this.callLogModel.countDocuments({ ...callQuery, type: 'knowledge_search' }),
        this.callLogModel.aggregate([
          { $match: callQuery },
          { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
        ]),
        this.callLogModel.aggregate([
          { $match: callQuery },
          { $group: { _id: null, totalTokens: { $sum: { $ifNull: ['$tokensUsed', 0] } } } },
        ]),
      ]);

    return {
      totalCalls,
      aiGenerateCalls,
      knowledgeSearchCalls,
      avgDuration: avgDurationResult.length > 0 ? Number(avgDurationResult[0].avgDuration.toFixed(0)) : 0,
      totalTokens: totalTokensResult.length > 0 ? totalTokensResult[0].totalTokens : 0,
    };
  }
}
