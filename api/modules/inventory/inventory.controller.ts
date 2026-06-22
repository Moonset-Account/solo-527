import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { InventoryService } from './inventory.service.js';
import { InventoryLog } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord } from '../../schemas/scrap-record.schema.js';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
  ) {}

  @Get('overview')
  async getOverview(@Req() req: Request): Promise<any[]> {
    const isSandbox = req.isSandbox;
    const ingredients = await this.ingredientModel.find({ isSandbox }).exec();
    return ingredients.map(ing => ({
      _id: ing._id,
      ingredientId: ing._id,
      ingredientName: ing.name,
      category: ing.category,
      unit: ing.unit,
      currentStock: ing.currentStock,
      minStock: ing.minStock,
      currentCost: ing.costPerUnit,
      updatedAt: ing.updatedAt,
    }));
  }

  @Get('logs')
  async findAllLogs(@Req() req: Request): Promise<InventoryLog[]> {
    return this.inventoryService.findAllLogs(req.isSandbox);
  }

  @Get('logs/:id')
  async findOneLog(@Param('id') id: string): Promise<InventoryLog | null> {
    return this.inventoryService.findOneLog(id);
  }

  @Post('logs')
  async createLog(@Body() data: Partial<InventoryLog>, @Req() req: Request): Promise<InventoryLog> {
    return this.inventoryService.createLog({ ...data, isSandbox: req.isSandbox });
  }

  @Post('inbound')
  async inbound(@Body() data: Partial<InventoryLog>, @Req() req: Request): Promise<InventoryLog> {
    const isSandbox = req.isSandbox;
    if (data.ingredientId) {
      const ing = await this.ingredientModel.findById(data.ingredientId).exec();
      if (ing) {
        await this.ingredientModel.findByIdAndUpdate(data.ingredientId, {
          $inc: { currentStock: data.quantity || 0 },
        }).exec();
      }
    }
    return this.inventoryService.createLog({
      ...data,
      type: 'inbound',
      isSandbox,
    });
  }

  @Post('outbound')
  async outbound(@Body() data: Partial<InventoryLog>, @Req() req: Request): Promise<InventoryLog> {
    const isSandbox = req.isSandbox;
    if (data.ingredientId) {
      const ing = await this.ingredientModel.findById(data.ingredientId).exec();
      if (ing) {
        await this.ingredientModel.findByIdAndUpdate(data.ingredientId, {
          $inc: { currentStock: -(data.quantity || 0) },
        }).exec();
      }
    }
    return this.inventoryService.createLog({
      ...data,
      type: 'outbound',
      isSandbox,
    });
  }

  @Get('scraps')
  async findAllScraps(@Req() req: Request): Promise<ScrapRecord[]> {
    return this.inventoryService.findAllScraps(req.isSandbox);
  }

  @Get('scraps/:id')
  async findOneScrap(@Param('id') id: string): Promise<ScrapRecord | null> {
    return this.inventoryService.findOneScrap(id);
  }

  @Post('scraps')
  async createScrap(@Body() data: Partial<ScrapRecord>, @Req() req: Request): Promise<ScrapRecord> {
    return this.inventoryService.createScrap({ ...data, isSandbox: req.isSandbox });
  }
}
