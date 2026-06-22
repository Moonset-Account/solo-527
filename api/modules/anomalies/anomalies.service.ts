import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CostAnomaly } from '../../schemas/cost-anomaly.schema.js';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { Batch } from '../../schemas/batch.schema.js';
import { ScrapRecord } from '../../schemas/scrap-record.schema.js';

@Injectable()
export class AnomaliesService {
  constructor(
    @InjectModel(CostAnomaly.name) private anomalyModel: Model<CostAnomaly>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(ScrapRecord.name) private scrapRecordModel: Model<ScrapRecord>,
  ) {}

  async findAll(params: { type?: string; severity?: string; status?: string }, isSandbox = false): Promise<CostAnomaly[]> {
    const query: any = { isSandbox };

    if (params.type) {
      query.type = params.type;
    }
    if (params.severity) {
      query.severity = params.severity;
    }
    if (params.status) {
      query.status = params.status;
    }

    return this.anomalyModel.find(query).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string, isSandbox = false): Promise<CostAnomaly | null> {
    return this.anomalyModel.findOne({ _id: id, isSandbox }).exec();
  }

  async create(data: Partial<CostAnomaly>, isSandbox = false): Promise<CostAnomaly> {
    const anomaly = new this.anomalyModel({
      ...data,
      isSandbox,
      status: data.status || 'open',
    });
    return anomaly.save();
  }

  async update(id: string, data: Partial<CostAnomaly>, isSandbox = false): Promise<CostAnomaly | null> {
    return this.anomalyModel.findOneAndUpdate(
      { _id: id, isSandbox },
      data,
      { new: true },
    ).exec();
  }

  async remove(id: string, isSandbox = false): Promise<CostAnomaly | null> {
    return this.anomalyModel.findOneAndDelete({ _id: id, isSandbox }).exec();
  }

  async assignResponsible(id: string, person: string, isSandbox = false): Promise<CostAnomaly | null> {
    const anomaly = await this.anomalyModel.findOne({ _id: id, isSandbox }).exec();
    if (!anomaly) {
      throw new NotFoundException('Anomaly not found');
    }
    anomaly.responsiblePerson = person;
    if (anomaly.status === 'open') {
      anomaly.status = 'handling';
    }
    return anomaly.save();
  }

  async setHandlingPlan(id: string, plan: string, isSandbox = false): Promise<CostAnomaly | null> {
    const anomaly = await this.anomalyModel.findOne({ _id: id, isSandbox }).exec();
    if (!anomaly) {
      throw new NotFoundException('Anomaly not found');
    }
    anomaly.handlingPlan = plan;
    if (anomaly.status === 'open') {
      anomaly.status = 'handling';
    }
    return anomaly.save();
  }

  async updateStatus(id: string, status: string, isSandbox = false): Promise<CostAnomaly | null> {
    const anomaly = await this.anomalyModel.findOne({ _id: id, isSandbox }).exec();
    if (!anomaly) {
      throw new NotFoundException('Anomaly not found');
    }
    anomaly.status = status;
    if (status === 'resolved' && !anomaly.resolvedAt) {
      anomaly.resolvedAt = new Date();
    }
    return anomaly.save();
  }

  async detectAnomalies(isSandbox = false): Promise<{ detected: number; anomalies: CostAnomaly[] }> {
    const detectedAnomalies: CostAnomaly[] = [];

    const lowStockAnomalies = await this.detectLowStock(isSandbox);
    detectedAnomalies.push(...lowStockAnomalies);

    const costSpikeAnomalies = await this.detectCostSpike(isSandbox);
    detectedAnomalies.push(...costSpikeAnomalies);

    const highScrapAnomalies = await this.detectHighScrap(isSandbox);
    detectedAnomalies.push(...highScrapAnomalies);

    return {
      detected: detectedAnomalies.length,
      anomalies: detectedAnomalies,
    };
  }

  private async detectLowStock(isSandbox: boolean): Promise<CostAnomaly[]> {
    const anomalies: CostAnomaly[] = [];
    const ingredients = await this.ingredientModel.find({ isSandbox }).exec();

    for (const ingredient of ingredients) {
      if (ingredient.currentStock < ingredient.minStock) {
        const existingAnomaly = await this.anomalyModel.findOne({
          type: 'low_stock',
          ingredientId: ingredient._id,
          status: { $in: ['open', 'handling'] },
          isSandbox,
        }).exec();

        if (!existingAnomaly) {
          const severity = ingredient.currentStock < ingredient.minStock * 0.5 ? 'high' : 'medium';
          const anomaly = new this.anomalyModel({
            type: 'low_stock',
            severity,
            description: `${ingredient.name}库存低于最低库存线，当前${ingredient.currentStock}${ingredient.unit}，最低要求${ingredient.minStock}${ingredient.unit}`,
            ingredientId: ingredient._id,
            ingredientName: ingredient.name,
            expectedCost: ingredient.costPerUnit,
            actualCost: ingredient.costPerUnit,
            impactScope: `可能影响使用${ingredient.name}的产品生产`,
            status: 'open',
            isSandbox,
          });
          await anomaly.save();
          anomalies.push(anomaly);
        }
      }
    }

    return anomalies;
  }

  private async detectCostSpike(isSandbox: boolean): Promise<CostAnomaly[]> {
    const anomalies: CostAnomaly[] = [];
    const ingredients = await this.ingredientModel.find({ isSandbox }).exec();

    for (const ingredient of ingredients) {
      const costHistory = (ingredient as any).costHistory;
      if (costHistory && costHistory.length >= 2) {
        const sorted = [...costHistory].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const oldest = sorted[0];
        const newest = sorted[sorted.length - 1];
        const changeRate = ((newest.cost - oldest.cost) / oldest.cost) * 100;

        if (changeRate >= 5) {
          const existingAnomaly = await this.anomalyModel.findOne({
            type: 'cost_spike',
            ingredientId: ingredient._id,
            status: { $in: ['open', 'handling'] },
            isSandbox,
          }).exec();

          if (!existingAnomaly) {
            const severity = changeRate >= 10 ? 'high' : changeRate >= 7 ? 'medium' : 'low';
            const anomaly = new this.anomalyModel({
              type: 'cost_spike',
              severity,
              description: `${ingredient.name}成本上涨${changeRate.toFixed(1)}%，从${oldest.cost}元/${ingredient.unit}涨至${newest.cost}元/${ingredient.unit}`,
              ingredientId: ingredient._id,
              ingredientName: ingredient.name,
              expectedCost: oldest.cost,
              actualCost: newest.cost,
              impactScope: `影响使用${ingredient.name}的产品成本结构`,
              status: 'open',
              isSandbox,
            });
            await anomaly.save();
            anomalies.push(anomaly);
          }
        }
      }
    }

    return anomalies;
  }

  private async detectHighScrap(isSandbox: boolean): Promise<CostAnomaly[]> {
    const anomalies: CostAnomaly[] = [];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentBatches = await this.batchModel.find({
      isSandbox,
      createdAt: { $gte: sevenDaysAgo },
    }).exec();

    const scrapRecords = await this.scrapRecordModel.find({
      isSandbox,
    }).exec();

    const batchScrapMap: Record<string, number> = {};
    for (const scrap of scrapRecords) {
      if (!batchScrapMap[scrap.batchId]) {
        batchScrapMap[scrap.batchId] = 0;
      }
      batchScrapMap[scrap.batchId] += scrap.quantity;
    }

    let highScrapCount = 0;
    const affectedBatches: string[] = [];

    for (const batch of recentBatches) {
      const batchId = batch._id.toString();
      if (batchScrapMap[batchId]) {
        const scrapRate = batchScrapMap[batchId] / (batch.plannedQty || 1);
        if (scrapRate > 0.1) {
          highScrapCount++;
          affectedBatches.push(batchId);
        }
      }
    }

    if (highScrapCount >= 2) {
      const existingAnomaly = await this.anomalyModel.findOne({
        type: 'high_scrap',
        status: { $in: ['open', 'handling'] },
        isSandbox,
      }).exec();

      if (!existingAnomaly) {
        const anomaly = new this.anomalyModel({
          type: 'high_scrap',
          severity: 'medium',
          description: `近7天内有${highScrapCount}个批次报损率超过10%，需要关注生产质量控制`,
          relatedRecords: affectedBatches,
          impactScope: `影响${highScrapCount}个批次的生产成本和交付`,
          status: 'open',
          isSandbox,
        });
        await anomaly.save();
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }
}
