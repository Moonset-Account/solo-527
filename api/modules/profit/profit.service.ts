import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProfitRecord } from '../../schemas/profit-record.schema.js';
import { Batch } from '../../schemas/batch.schema.js';
import { Recipe } from '../../schemas/recipe.schema.js';
import { ScrapRecord } from '../../schemas/scrap-record.schema.js';

@Injectable()
export class ProfitService {
  constructor(
    @InjectModel(ProfitRecord.name) private profitRecordModel: Model<ProfitRecord>,
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(Recipe.name) private recipeModel: Model<Recipe>,
    @InjectModel(ScrapRecord.name) private scrapRecordModel: Model<ScrapRecord>,
  ) {}

  async getTrend(params: { period?: string; dateFrom?: string; dateTo?: string }, isSandbox = false): Promise<any[]> {
    const { period = 'day', dateFrom, dateTo } = params;
    const query: any = { isSandbox };

    if (dateFrom) {
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: dateTo };
    }

    const records = await this.profitRecordModel.find(query).sort({ date: 1 }).exec();

    if (period === 'day') {
      return records;
    }

    const grouped: Record<string, any> = {};
    for (const record of records) {
      let key: string;
      const d = new Date(record.date);
      if (period === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'month') {
        key = record.date.substring(0, 7);
      } else {
        key = record.date;
      }

      if (!grouped[key]) {
        grouped[key] = {
          date: key,
          revenue: 0,
          cost: 0,
          margin: 0,
          batchCount: 0,
          materialCost: 0,
          supplyCost: 0,
          reworkCost: 0,
        };
      }
      grouped[key].revenue += record.revenue;
      grouped[key].cost += record.cost;
      grouped[key].margin += record.margin;
      grouped[key].batchCount += record.batchCount;
      grouped[key].materialCost += record.materialCost || 0;
      grouped[key].supplyCost += record.supplyCost || 0;
      grouped[key].reworkCost += record.reworkCost || 0;
    }

    const result = Object.values(grouped).map(g => ({
      ...g,
      marginRate: g.revenue > 0 ? parseFloat(((g.margin / g.revenue) * 100).toFixed(2)) : 0,
    }));

    return result.sort((a, b) => a.date.localeCompare(b.date));
  }

  async getSummary(params: { dateFrom?: string; dateTo?: string }, isSandbox = false): Promise<any> {
    const { dateFrom, dateTo } = params;
    const query: any = { isSandbox };

    if (dateFrom) {
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: dateTo };
    }

    const records = await this.profitRecordModel.find(query).exec();

    let totalRevenue = 0;
    let totalCost = 0;
    let totalMargin = 0;
    let totalBatchCount = 0;
    let totalMaterialCost = 0;
    let totalSupplyCost = 0;
    let totalReworkCost = 0;

    for (const record of records) {
      totalRevenue += record.revenue;
      totalCost += record.cost;
      totalMargin += record.margin;
      totalBatchCount += record.batchCount;
      totalMaterialCost += record.materialCost || 0;
      totalSupplyCost += record.supplyCost || 0;
      totalReworkCost += record.reworkCost || 0;
    }

    return {
      totalRevenue,
      totalCost,
      totalMargin,
      totalBatchCount,
      marginRate: totalRevenue > 0 ? parseFloat(((totalMargin / totalRevenue) * 100).toFixed(2)) : 0,
      costComposition: {
        materialCost: totalMaterialCost,
        supplyCost: totalSupplyCost,
        reworkCost: totalReworkCost,
        materialRate: totalCost > 0 ? parseFloat(((totalMaterialCost / totalCost) * 100).toFixed(2)) : 0,
        supplyRate: totalCost > 0 ? parseFloat(((totalSupplyCost / totalCost) * 100).toFixed(2)) : 0,
        reworkRate: totalCost > 0 ? parseFloat(((totalReworkCost / totalCost) * 100).toFixed(2)) : 0,
      },
    };
  }

  async getByRecipe(params: { dateFrom?: string; dateTo?: string }, isSandbox = false): Promise<any[]> {
    const { dateFrom, dateTo } = params;
    const query: any = { isSandbox, recipeId: { $exists: true } };

    if (dateFrom) {
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: dateTo };
    }

    const records = await this.profitRecordModel.find(query).exec();

    const grouped: Record<string, any> = {};
    for (const record of records) {
      const key = record.recipeId;
      if (!key) continue;

      if (!grouped[key]) {
        grouped[key] = {
          recipeId: record.recipeId,
          recipeName: record.recipeName,
          revenue: 0,
          cost: 0,
          margin: 0,
          batchCount: 0,
          quantity: 0,
        };
      }
      grouped[key].revenue += record.revenue;
      grouped[key].cost += record.cost;
      grouped[key].margin += record.margin;
      grouped[key].batchCount += record.batchCount || 0;
      grouped[key].quantity += record.quantity || 0;
    }

    return Object.values(grouped).map(g => ({
      ...g,
      marginRate: g.revenue > 0 ? parseFloat(((g.margin / g.revenue) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  async getByBatch(params: { dateFrom?: string; dateTo?: string }, isSandbox = false): Promise<any[]> {
    const { dateFrom, dateTo } = params;
    const query: any = { isSandbox, batchId: { $exists: true } };

    if (dateFrom) {
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: dateTo };
    }

    const records = await this.profitRecordModel.find(query).sort({ date: -1 }).exec();

    return records.map(r => ({
      _id: r._id,
      batchId: r.batchId,
      batchNo: r.batchNo,
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      teamId: r.teamId,
      teamName: r.teamName,
      date: r.date,
      revenue: r.revenue,
      cost: r.cost,
      margin: r.margin,
      marginRate: r.marginRate,
      quantity: r.quantity,
      materialCost: r.materialCost,
      supplyCost: r.supplyCost,
      reworkCost: r.reworkCost,
    }));
  }

  async getByTeam(params: { dateFrom?: string; dateTo?: string }, isSandbox = false): Promise<any[]> {
    const { dateFrom, dateTo } = params;
    const query: any = { isSandbox, teamId: { $exists: true } };

    if (dateFrom) {
      query.date = { ...query.date, $gte: dateFrom };
    }
    if (dateTo) {
      query.date = { ...query.date, $lte: dateTo };
    }

    const records = await this.profitRecordModel.find(query).exec();

    const grouped: Record<string, any> = {};
    for (const record of records) {
      const key = record.teamId;
      if (!key) continue;

      if (!grouped[key]) {
        grouped[key] = {
          teamId: record.teamId,
          teamName: record.teamName,
          revenue: 0,
          cost: 0,
          margin: 0,
          batchCount: 0,
        };
      }
      grouped[key].revenue += record.revenue;
      grouped[key].cost += record.cost;
      grouped[key].margin += record.margin;
      grouped[key].batchCount += record.batchCount || 0;
    }

    return Object.values(grouped).map(g => ({
      ...g,
      marginRate: g.revenue > 0 ? parseFloat(((g.margin / g.revenue) * 100).toFixed(2)) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }

  async createRecord(data: Partial<ProfitRecord>, isSandbox = false): Promise<ProfitRecord> {
    const record = new this.profitRecordModel({
      ...data,
      isSandbox,
    });
    return record.save();
  }

  async findAll(isSandbox = false): Promise<ProfitRecord[]> {
    return this.profitRecordModel.find({ isSandbox }).exec();
  }

  async findOne(id: string): Promise<ProfitRecord | null> {
    return this.profitRecordModel.findById(id).exec();
  }

  async create(data: Partial<ProfitRecord>): Promise<ProfitRecord> {
    return this.profitRecordModel.create(data);
  }

  async update(id: string, data: Partial<ProfitRecord>): Promise<ProfitRecord | null> {
    return this.profitRecordModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async remove(id: string): Promise<ProfitRecord | null> {
    return this.profitRecordModel.findByIdAndDelete(id).exec();
  }
}
