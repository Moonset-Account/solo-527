import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../leads/lead.schema.js';
import { Contract, ContractDocument } from './contract.schema.js';
import { Followup, FollowupDocument } from '../followups/followup.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
  ) {}

  async getLeadQuality() {
    const qualityBySource = await this.leadModel.aggregate([
      {
        $group: {
          _id: '$source',
          total: { $sum: 1 },
          contracted: {
            $sum: { $cond: [{ $eq: ['$status', 'contracted'] }, 1, 0] },
          },
          lost: {
            $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          source: '$_id',
          total: 1,
          contracted: 1,
          lost: 1,
          conversionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$contracted', { $max: ['$total', 1] }] },
                  100,
                ],
              },
              1,
            ],
          },
        },
      },
      { $sort: { conversionRate: -1 } },
    ]);

    const overallConversion = await this.leadModel.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          contracted: [{ $match: { status: 'contracted' } }, { $count: 'count' }],
        },
      },
    ]);

    return {
      bySource: qualityBySource,
      overall: {
        total: overallConversion[0]?.total[0]?.count || 0,
        contracted: overallConversion[0]?.contracted[0]?.count || 0,
      },
    };
  }

  async getContractPending() {
    const pendingContracts = await this.contractModel
      .find({ status: 'pending' })
      .populate('leadId', 'customerName phone status source')
      .sort({ createdAt: -1 })
      .lean();

    const stats = await this.contractModel.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: '$pendingReason',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    return {
      contracts: pendingContracts,
      stats: stats.map((s) => ({ reason: s._id, count: s.count })),
    };
  }

  async getProcessingTime() {
    const leads = await this.leadModel
      .find({ status: { $in: ['contracted', 'lost'] } })
      .lean();

    const processingTimes = leads.map((lead) => {
      const created = new Date(lead.createdAt).getTime();
      const updated = new Date(lead.updatedAt).getTime();
      return {
        leadId: lead._id,
        customerName: lead.customerName,
        status: lead.status,
        source: lead.source,
        hours: Math.round((updated - created) / (1000 * 60 * 60)),
      };
    });

    const avgHours =
      processingTimes.length > 0
        ? Math.round(
            processingTimes.reduce((sum, p) => sum + p.hours, 0) /
              processingTimes.length,
          )
        : 0;

    const bySource: Record<string, { total: number; count: number; avg: number }> = {};
    for (const pt of processingTimes) {
      if (!bySource[pt.source]) bySource[pt.source] = { total: 0, count: 0, avg: 0 };
      bySource[pt.source].total += pt.hours;
      bySource[pt.source].count++;
    }
    for (const key of Object.keys(bySource)) {
      bySource[key].avg = Math.round(bySource[key].total / bySource[key].count);
    }

    return { avgHours, bySource, details: processingTimes };
  }

  async getResponsiblePerson() {
    const leads = await this.leadModel
      .find()
      .populate('assignedTo', 'name role')
      .lean();

    const personStats: Record<
      string,
      { name: string; total: number; contracted: number; lost: number; inProgress: number }
    > = {};

    for (const lead of leads) {
      const personId = (lead.assignedTo as any)?._id?.toString() || 'unassigned';
      const personName = (lead.assignedTo as any)?.name || '未分配';

      if (!personStats[personId]) {
        personStats[personId] = {
          name: personName,
          total: 0,
          contracted: 0,
          lost: 0,
          inProgress: 0,
        };
      }

      personStats[personId].total++;
      if (lead.status === 'contracted') personStats[personId].contracted++;
      else if (lead.status === 'lost') personStats[personId].lost++;
      else personStats[personId].inProgress++;
    }

    return Object.values(personStats).sort((a, b) => b.total - a.total);
  }
}
