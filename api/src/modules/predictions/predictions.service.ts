import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Prediction, PredictionDocument } from './prediction.schema.js';
import { Lead, LeadDocument } from '../leads/lead.schema.js';
import { Followup, FollowupDocument } from '../followups/followup.schema.js';

@Injectable()
export class PredictionsService {
  constructor(
    @InjectModel(Prediction.name) private predictionModel: Model<PredictionDocument>,
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Followup.name) private followupModel: Model<FollowupDocument>,
  ) {}

  async calculatePrediction(leadId: string) {
    const lead = await this.leadModel.findById(leadId).lean();
    if (!lead) return null;

    const followupCount = await this.followupModel.countDocuments({
      leadId: new Types.ObjectId(leadId),
      completedAt: { $ne: null },
    });

    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    const statusScoreMap: Record<string, number> = {
      new: 20,
      contacted: 40,
      measured: 60,
      quoted: 75,
      contracted: 95,
      lost: 0,
    };

    const statusFactor = statusScoreMap[lead.status] ?? 30;
    const followupFactor = Math.min(followupCount * 10, 30);
    const demandFactor = lead.decorationDemand?.area
      ? Math.min(lead.decorationDemand.area / 10, 20)
      : 10;
    const timeDecayFactor = Math.max(0, 20 - daysSinceCreated * 0.5);

    const factors = [
      { name: '线索状态', weight: 0.4, value: statusFactor },
      { name: '回访频率', weight: 0.25, value: followupFactor },
      { name: '需求匹配', weight: 0.2, value: demandFactor },
      { name: '时效性', weight: 0.15, value: timeDecayFactor },
    ];

    const score = Math.round(
      factors.reduce((sum, f) => sum + f.value * f.weight, 0),
    );

    let riskLevel = 'low';
    if (score < 30 || lead.status === 'lost') riskLevel = 'high';
    else if (score < 55) riskLevel = 'medium';

    const existing = await this.predictionModel.findOne({
      leadId: new Types.ObjectId(leadId),
    });
    if (existing) {
      existing.score = score;
      existing.factors = factors;
      existing.riskLevel = riskLevel;
      await existing.save();
      return existing.toObject();
    }

    const created = new this.predictionModel({
      leadId: new Types.ObjectId(leadId),
      score,
      factors,
      riskLevel,
    });
    return created.save();
  }

  async findAll() {
    return this.predictionModel
      .find()
      .populate('leadId', 'customerName phone status source')
      .sort({ score: -1 })
      .lean();
  }

  async getFunnel() {
    const leads = await this.leadModel.find().lean();
    const funnel = {
      new: 0,
      contacted: 0,
      measured: 0,
      quoted: 0,
      contracted: 0,
      lost: 0,
    };
    for (const lead of leads) {
      if (funnel[lead.status] !== undefined) {
        funnel[lead.status]++;
      }
    }
    const total = leads.length || 1;
    const conversionRates: Record<string, number> = {};
    const stages = Object.keys(funnel);
    for (let i = 1; i < stages.length; i++) {
      const prev = funnel[stages[i - 1]] || 0;
      const curr = funnel[stages[i]] || 0;
      conversionRates[stages[i]] = prev > 0 ? Math.round((curr / prev) * 100) : 0;
    }
    return { funnel, total, conversionRates };
  }

  async getRisks() {
    const highRisks = await this.predictionModel
      .find({ riskLevel: 'high' })
      .populate('leadId', 'customerName phone status source')
      .sort({ score: 1 })
      .lean();

    const mediumRisks = await this.predictionModel
      .find({ riskLevel: 'medium' })
      .populate('leadId', 'customerName phone status source')
      .sort({ score: 1 })
      .lean();

    return {
      high: highRisks,
      medium: mediumRisks,
      summary: {
        highCount: highRisks.length,
        mediumCount: mediumRisks.length,
        lowCount: await this.predictionModel.countDocuments({ riskLevel: 'low' }),
      },
    };
  }
}
