import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Batch } from '../../schemas/batch.schema.js';
import { Recipe } from '../../schemas/recipe.schema.js';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { InventoryLog } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord } from '../../schemas/scrap-record.schema.js';
import { RedisService } from '../../redis/redis.service.js';
import { createPaginatedResult, type PaginatedResult } from '../../common/dto/pagination.dto.js';

export interface FindBatchParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  recipeId?: string;
  teamId?: string;
  status?: string;
  search?: string;
}

export interface ScrapData {
  quantity: number;
  reason: string;
  ingredientId?: string;
  ingredientName?: string;
  attachments?: { url: string; name: string }[];
}

export interface ReworkData {
  reworkQty: number;
  reworkCost: number;
  reason?: string;
  recipeId?: string;
}

export interface NoteData {
  content: string;
  author?: string;
}

export interface AttachmentData {
  url: string;
  name: string;
}

@Injectable()
export class BatchesService {
  constructor(
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(Recipe.name) private recipeModel: Model<Recipe>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
    @InjectModel(InventoryLog.name) private inventoryLogModel: Model<InventoryLog>,
    @InjectModel(ScrapRecord.name) private scrapRecordModel: Model<ScrapRecord>,
    private redisService: RedisService,
  ) {}

  async findAll(params: FindBatchParams, isSandbox = false): Promise<PaginatedResult<Batch>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const filter: FilterQuery<Batch> = { isSandbox, deletedAt: null };

    if (params.startDate && params.endDate) {
      filter.createdAt = {
        $gte: new Date(params.startDate),
        $lte: new Date(params.endDate),
      };
    } else if (params.startDate) {
      filter.createdAt = { $gte: new Date(params.startDate) };
    } else if (params.endDate) {
      filter.createdAt = { $lte: new Date(params.endDate) };
    }

    if (params.recipeId) {
      filter.recipeId = params.recipeId;
    }

    if (params.teamId) {
      filter.teamId = params.teamId;
    }

    if (params.status) {
      filter.status = params.status;
    }

    if (params.search) {
      filter.$or = [
        { batchNo: { $regex: params.search, $options: 'i' } },
        { recipeName: { $regex: params.search, $options: 'i' } },
        { teamName: { $regex: params.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.batchModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.batchModel.countDocuments(filter).exec(),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string, isSandbox = false): Promise<Batch | null> {
    return this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
  }

  async create(data: Partial<Batch>, isSandbox = false): Promise<Batch> {
    if (!data.recipeId) {
      throw new BadRequestException('recipeId is required');
    }

    const recipe = await this.recipeModel.findOne({ _id: data.recipeId, isSandbox }).exec();
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    const batchNo = await this.generateBatchNo(isSandbox);

    const standardCost = await this.calculateStandardCost(recipe, data.plannedQty || 0);

    const batchData: Partial<Batch> = {
      ...data,
      batchNo,
      recipeName: recipe.name,
      unit: recipe.unit,
      status: data.status || 'pending',
      actualQty: data.actualQty || 0,
      standardCost,
      actualCost: standardCost,
      costVariance: 0,
      reworkCost: 0,
      consumableCost: 0,
      scrapQty: 0,
      reworkQty: 0,
      isRework: data.isRework || false,
      parentBatchId: data.parentBatchId || undefined,
      attachments: data.attachments || [],
      notes: data.notes || [],
      history: [],
      isSandbox,
    };

    const batch = await this.batchModel.create(batchData);

    await this.deductInventory(recipe, data.plannedQty || 0, batch._id.toString(), batchNo, isSandbox);

    return batch;
  }

  async update(id: string, data: Partial<Batch>, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const historyEntries = [];
    const fieldsToCheck = ['status', 'plannedQty', 'actualQty', 'teamId', 'teamName', 'startTime', 'endTime'];

    for (const field of fieldsToCheck) {
      if (data[field] !== undefined && data[field] !== batch[field]) {
        historyEntries.push({
          field,
          oldValue: batch[field],
          newValue: data[field],
          changedBy: operator,
          changedAt: new Date(),
        });
      }
    }

    const updatedData: Partial<Batch> = { ...data };

    if (data.plannedQty !== undefined || data.actualQty !== undefined) {
      if (batch.recipeId) {
        const recipe = await this.recipeModel.findOne({ _id: batch.recipeId, isSandbox }).exec();
        if (recipe) {
          const qty = data.actualQty !== undefined ? data.actualQty : (data.plannedQty !== undefined ? data.plannedQty : batch.plannedQty);
          const standardCost = await this.calculateStandardCost(recipe, qty);
          updatedData.standardCost = standardCost;
          updatedData.costVariance = (updatedData.actualCost !== undefined ? updatedData.actualCost : batch.actualCost) - standardCost;
        }
      }
    }

    if (historyEntries.length > 0) {
      updatedData.history = [...batch.history, ...historyEntries];
    }

    return this.batchModel.findByIdAndUpdate(id, updatedData, { new: true }).exec();
  }

  async remove(id: string, isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return this.batchModel.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true }).exec();
  }

  async pickUp(id: string, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (batch.status === 'picked_up') {
      throw new BadRequestException('Batch already picked up');
    }

    const historyEntry = {
      field: 'status',
      oldValue: batch.status,
      newValue: 'picked_up',
      changedBy: operator,
      changedAt: new Date(),
    };

    return this.batchModel.findByIdAndUpdate(
      id,
      {
        status: 'picked_up',
        endTime: new Date(),
        $push: { history: historyEntry },
      },
      { new: true },
    ).exec();
  }

  async recordScrap(id: string, scrapData: ScrapData, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const scrapRecord = await this.scrapRecordModel.create({
      batchId: id,
      batchNo: batch.batchNo,
      ingredientId: scrapData.ingredientId || '',
      ingredientName: scrapData.ingredientName || '',
      quantity: scrapData.quantity,
      reason: scrapData.reason,
      operator,
      isSandbox,
    });

    const newScrapQty = (batch.scrapQty || 0) + scrapData.quantity;

    const historyEntry = {
      field: 'scrapQty',
      oldValue: batch.scrapQty || 0,
      newValue: newScrapQty,
      changedBy: operator,
      changedAt: new Date(),
    };

    const updatedBatch = await this.batchModel.findByIdAndUpdate(
      id,
      {
        scrapQty: newScrapQty,
        $push: { history: historyEntry },
      },
      { new: true },
    ).exec();

    return updatedBatch;
  }

  async recordRework(id: string, reworkData: ReworkData, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const newReworkQty = (batch.reworkQty || 0) + reworkData.reworkQty;
    const newReworkCost = (batch.reworkCost || 0) + reworkData.reworkCost;
    const newActualCost = (batch.actualCost || 0) + reworkData.reworkCost;
    const newCostVariance = newActualCost - (batch.standardCost || 0);

    const historyEntries = [
      {
        field: 'reworkQty',
        oldValue: batch.reworkQty || 0,
        newValue: newReworkQty,
        changedBy: operator,
        changedAt: new Date(),
      },
      {
        field: 'reworkCost',
        oldValue: batch.reworkCost || 0,
        newValue: newReworkCost,
        changedBy: operator,
        changedAt: new Date(),
      },
    ];

    const updatedBatch = await this.batchModel.findByIdAndUpdate(
      id,
      {
        reworkQty: newReworkQty,
        reworkCost: newReworkCost,
        actualCost: newActualCost,
        costVariance: newCostVariance,
        $push: { history: { $each: historyEntries } },
      },
      { new: true },
    ).exec();

    return updatedBatch;
  }

  async addNote(id: string, noteData: NoteData, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const note = {
      content: noteData.content,
      author: noteData.author || operator,
      createdAt: new Date(),
    };

    return this.batchModel.findByIdAndUpdate(
      id,
      { $push: { notes: note } },
      { new: true },
    ).exec();
  }

  async addAttachment(id: string, attachmentData: AttachmentData, operator = 'system', isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    const attachment = {
      url: attachmentData.url,
      name: attachmentData.name,
      uploadedAt: new Date(),
    };

    return this.batchModel.findByIdAndUpdate(
      id,
      { $push: { attachments: attachment } },
      { new: true },
    ).exec();
  }

  async calculateCosts(id: string, isSandbox = false): Promise<Batch | null> {
    const batch = await this.batchModel.findOne({ _id: id, isSandbox, deletedAt: null }).exec();
    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    if (!batch.recipeId) {
      return batch;
    }

    const recipe = await this.recipeModel.findOne({ _id: batch.recipeId, isSandbox }).exec();
    if (!recipe) {
      return batch;
    }

    const qty = batch.actualQty || batch.plannedQty || 0;
    const standardCost = await this.calculateStandardCost(recipe, qty);
    const actualCost = standardCost + (batch.reworkCost || 0) + (batch.consumableCost || 0);
    const costVariance = actualCost - standardCost;

    return this.batchModel.findByIdAndUpdate(
      id,
      {
        standardCost,
        actualCost,
        costVariance,
      },
      { new: true },
    ).exec();
  }

  private async generateBatchNo(isSandbox: boolean): Promise<string> {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');

    const prefix = isSandbox ? 'SB' : 'B';
    const key = `batch:seq:${dateStr}:${isSandbox ? 'sandbox' : 'prod'}`;

    let seq: number;

    try {
      const redisSeq = await this.redisService.get(key);
      if (redisSeq !== null) {
        seq = parseInt(redisSeq, 10) + 1;
        await this.redisService.set(key, seq.toString(), 86400);
      } else {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        const count = await this.batchModel.countDocuments({
          isSandbox,
          createdAt: { $gte: todayStart, $lt: todayEnd },
        }).exec();

        seq = count + 1;
        await this.redisService.set(key, seq.toString(), 86400);
      }
    } catch {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const count = await this.batchModel.countDocuments({
        isSandbox,
        createdAt: { $gte: todayStart, $lt: todayEnd },
      }).exec();

      seq = count + 1;
    }

    const seqStr = seq.toString().padStart(4, '0');
    return `${prefix}${dateStr}${seqStr}`;
  }

  private async calculateStandardCost(recipe: Recipe, qty: number): Promise<number> {
    if (!recipe.ingredients || recipe.ingredients.length === 0 || !recipe.yield || qty === 0) {
      return 0;
    }

    let totalCost = 0;
    const yieldRatio = qty / recipe.yield;

    for (const ingredient of recipe.ingredients) {
      const ingredientDoc = await this.ingredientModel.findById(ingredient.ingredientId).exec();
      if (ingredientDoc) {
        const ingredientQty = ingredient.ratio * yieldRatio;
        totalCost += ingredientQty * ingredientDoc.costPerUnit;
      }
    }

    return Math.round(totalCost * 100) / 100;
  }

  private async deductInventory(
    recipe: Recipe,
    qty: number,
    batchId: string,
    batchNo: string,
    isSandbox: boolean,
  ): Promise<void> {
    if (!recipe.ingredients || recipe.ingredients.length === 0 || !recipe.yield || qty === 0) {
      return;
    }

    const yieldRatio = qty / recipe.yield;

    for (const ingredient of recipe.ingredients) {
      const ingredientDoc = await this.ingredientModel.findById(ingredient.ingredientId).exec();
      if (ingredientDoc) {
        const deductQty = ingredient.ratio * yieldRatio;
        const costPerUnit = ingredientDoc.costPerUnit;
        const totalCost = Math.round(deductQty * costPerUnit * 100) / 100;

        await this.ingredientModel.findByIdAndUpdate(ingredient.ingredientId, {
          $inc: { currentStock: -deductQty },
        }).exec();

        await this.inventoryLogModel.create({
          ingredientId: ingredient.ingredientId,
          ingredientName: ingredient.ingredientName,
          type: 'outbound',
          quantity: deductQty,
          unit: ingredient.unit,
          costPerUnit,
          totalCost,
          operator: 'system',
          note: `批次 ${batchNo} 生产领料`,
          isSandbox,
        });
      }
    }
  }
}
