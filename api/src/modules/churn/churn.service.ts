import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChurnRecord, ChurnRecordDocument } from './churn-record.schema.js';
import { Lead, LeadDocument } from '../leads/lead.schema.js';
import { Followup, FollowupDocument } from '../followups/followup.schema.js';

@Injectable()
export class ChurnService {
  constructor(
    @InjectModel(ChurnRecord.name) private churnModel: Model<ChurnRecordDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
  ) {}

  async getReasons() {
    const reasons = await this.churnModel.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return reasons.map((r) => ({ reason: r._id, count: r.count }));
  }

  async getTrend(months: number = 6) {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - months, 1);

    const trend = await this.churnModel.aggregate([
      {
        $match: { churnedAt: { $gte: startDate } },
      },
      {
        $group: {
          _id: {
            year: { $year: '$churnedAt' },
            month: { $month: '$churnedAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return trend.map((t) => ({
      period: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
      count: t.count,
    }));
  }

  async getWarnings() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeLeads = await this.leadModel
      .find({ status: { $nin: ['contracted', 'lost'] } })
      .lean();

    const warnings = [];
    for (const lead of activeLeads) {
      const lastFollowup = await this.followupModel
        .findOne({ leadId: lead._id })
        .sort({ createdAt: -1 })
        .lean();

      const daysSinceLastContact = lastFollowup
        ? Math.floor(
            (now.getTime() - new Date(lastFollowup.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : Math.floor(
            (now.getTime() - new Date(lead.createdAt).getTime()) /
              (1000 * 60 * 60 * 24),
          );

      if (daysSinceLastContact > 7) {
        warnings.push({
          lead: {
            id: lead._id,
            customerName: lead.customerName,
            phone: lead.phone,
            status: lead.status,
            source: lead.source,
          },
          daysSinceLastContact,
          riskLevel: daysSinceLastContact > 14 ? 'high' : 'medium',
        });
      }
    }

    warnings.sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact);
    return warnings;
  }
}
