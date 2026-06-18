import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument } from '../leads/lead.schema.js';
import { Contract, ContractDocument } from './contract.schema.js';
import { Followup, FollowupDocument } from '../followups/followup.schema.js';
import { Prediction, PredictionDocument } from '../predictions/prediction.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Contract.name) private contractModel: Model<ContractDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
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
        },
      },
      {
        $project: {
          source: '$_id',
          count: '$total',
          conversionRate: {
            $round: [
              {
                $multiply: [
                  { $divide: ['$contracted', { $max: ['$total', 1] }] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { conversionRate: -1 } },
    ]);

    const result: any[] = [];
    for (const item of qualityBySource) {
      const score = await this.predictionModel.aggregate([
        { $lookup: { from: 'leads', localField: 'leadId', foreignField: '_id', as: 'lead' } },
        { $unwind: '$lead' },
        { $match: { 'lead.source': item.source } },
        { $group: { _id: null, avg: { $avg: '$score' } } },
      ]);
      result.push({
        source: item.source,
        count: item.count,
        conversionRate: item.conversionRate,
        avgScore: Math.round(score[0]?.avg || 50),
      });
    }
    return result;
  }

  async getContractPending() {
    const pendingContracts = await this.contractModel
      .find({ status: 'pending' })
      .populate('leadId', 'customerName')
      .sort({ createdAt: -1 })
      .lean();

    const byReason: Record<string, { count: number; details: any[] }> = {};
    for (const c of pendingContracts as any[]) {
      const reason = c.pendingReason || '未填写原因';
      if (!byReason[reason]) byReason[reason] = { count: 0, details: [] };
      byReason[reason].count++;
      byReason[reason].details.push({
        leadId: (c.leadId as any)?._id || c.leadId,
        leadName: (c.leadId as any)?.customerName || '',
        responsiblePerson: c.responsiblePerson || '',
      });
    }

    return Object.entries(byReason)
      .map(([reason, v]) => ({ reason, count: v.count, details: v.details }))
      .sort((a, b) => b.count - a.count);
  }

  async getProcessingTime() {
    const stageLabels: Record<string, string> = {
      new: '线索获取',
      contacted: '首次回访',
      measured: '量房阶段',
      quoted: '方案报价',
      contracted: '合同签订',
    };
    const stageOrder = ['new', 'contacted', 'measured', 'quoted', 'contracted'];

    const leads = await this.leadModel
      .find({ status: { $in: ['contracted', 'lost', 'quoted'] } })
      .sort({ createdAt: 1 })
      .lean();

    const followups = await this.followupModel
      .find({ completedAt: { $ne: null } })
      .sort({ completedAt: 1 })
      .lean();

    const stageHours: Record<string, { total: number; count: number; overtime: number }> = {};
    for (const s of stageOrder) {
      stageHours[s] = { total: 0, count: 0, overtime: 0 };
    }

    const threshold: Record<string, number> = {
      new: 24,
      contacted: 48,
      measured: 120,
      quoted: 72,
      contracted: 48,
    };

    for (const lead of leads as any[]) {
      const leadFollowups = (followups as any[]).filter(
        (f) => f.leadId?.toString() === lead._id.toString(),
      );

      let prevTime = new Date(lead.createdAt).getTime();
      const stages = ['new', 'contacted', 'measured', 'quoted'];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        let stageEndTime: number | null = null;

        if (stage === 'new') {
          const firstFollowup = leadFollowups[0];
          if (firstFollowup) stageEndTime = new Date(firstFollowup.completedAt).getTime();
        } else if (stage === 'contacted' && lead.measurementInfo?.measuredAt) {
          stageEndTime = new Date(lead.measurementInfo.measuredAt).getTime();
        } else if (stage === 'measured') {
          const afterMeasure = leadFollowups.find(
            (f) => lead.measurementInfo?.measuredAt
              && new Date(f.completedAt) > new Date(lead.measurementInfo.measuredAt),
          );
          if (afterMeasure) stageEndTime = new Date(afterMeasure.completedAt).getTime();
        } else if (stage === 'quoted' && lead.status === 'contracted') {
          stageEndTime = new Date(lead.updatedAt).getTime();
        }

        if (stageEndTime !== null) {
          const hours = Math.round((stageEndTime - prevTime) / (1000 * 60 * 60));
          if (hours > 0 && hours < 720) {
            stageHours[stage].total += hours;
            stageHours[stage].count++;
            if (hours > threshold[stage]) stageHours[stage].overtime++;
          }
          prevTime = stageEndTime;
        }
      }
    }

    return stageOrder
      .filter((s) => stageHours[s].count > 0)
      .map((s) => ({
        stage: stageLabels[s],
        avgHours: stageHours[s].count > 0 ? Math.round(stageHours[s].total / stageHours[s].count) : 0,
        overtimeRate: stageHours[s].count > 0 ? +(stageHours[s].overtime / stageHours[s].count).toFixed(2) : 0,
      }));
  }

  async getPerformance() {
    const leads = await this.leadModel
      .find()
      .populate('assignedTo', 'name')
      .lean();

    const allFollowups = await this.followupModel
      .find()
      .lean();

    const allPredictions = await this.predictionModel
      .find()
      .lean();

    const personStats: Record<string, {
      personName: string;
      leadsCount: number;
      contracted: number;
      hasFollowup: number;
      totalScore: number;
      scoredCount: number;
    }> = {};

    for (const lead of leads as any[]) {
      const personId = (lead.assignedTo as any)?._id?.toString() || 'unassigned';
      const personName = (lead.assignedTo as any)?.name || '未分配';

      if (!personStats[personId]) {
        personStats[personId] = {
          personName,
          leadsCount: 0,
          contracted: 0,
          hasFollowup: 0,
          totalScore: 0,
          scoredCount: 0,
        };
      }

      personStats[personId].leadsCount++;
      if (lead.status === 'contracted') personStats[personId].contracted++;

      const hasFu = (allFollowups as any[]).some(
        (f) => f.leadId?.toString() === lead._id.toString(),
      );
      if (hasFu) personStats[personId].hasFollowup++;

      const pred = (allPredictions as any[]).find(
        (p) => p.leadId?.toString() === lead._id.toString(),
      );
      if (pred) {
        personStats[personId].totalScore += pred.score;
        personStats[personId].scoredCount++;
      }
    }

    return Object.values(personStats).map((s) => ({
      personName: s.personName,
      leadsCount: s.leadsCount,
      followupRate: s.leadsCount > 0 ? Math.round((s.hasFollowup / s.leadsCount) * 100) : 0,
      closeRate: s.leadsCount > 0 ? Math.round((s.contracted / s.leadsCount) * 100) : 0,
      avgScore: s.scoredCount > 0 ? Math.round(s.totalScore / s.scoredCount) : 0,
    }));
  }
}
