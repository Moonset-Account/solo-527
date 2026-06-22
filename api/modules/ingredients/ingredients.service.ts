import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto.js';

@Injectable()
export class IngredientsService {
  constructor(@InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>) {}

  async findAll(
    isSandbox = false,
    options: {
      keyword?: string;
      category?: string;
      lowStock?: boolean;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<PaginatedResult<Ingredient>> {
    const { keyword, category, lowStock, page = 1, pageSize = 10 } = options;
    const filter: FilterQuery<Ingredient> = { isSandbox };

    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    if (lowStock) {
      filter.$expr = { $lte: ['$currentStock', '$minStock'] };
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.ingredientModel.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }).exec(),
      this.ingredientModel.countDocuments(filter).exec(),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<Ingredient | null> {
    const ingredient = await this.ingredientModel.findById(id).exec();
    if (!ingredient) {
      throw new NotFoundException('原料不存在');
    }
    return ingredient;
  }

  async create(data: Partial<Ingredient> & { isSandbox?: boolean }): Promise<Ingredient> {
    const isSandbox = data.isSandbox ?? false;
    const costPerUnit = data.costPerUnit ?? 0;

    const ingredientData = {
      ...data,
      isSandbox,
      costHistory: [
        {
          cost: costPerUnit,
          date: new Date(),
        },
      ],
    };

    return this.ingredientModel.create(ingredientData);
  }

  async update(id: string, data: Partial<Ingredient>): Promise<Ingredient | null> {
    const existingIngredient = await this.ingredientModel.findById(id).exec();
    if (!existingIngredient) {
      throw new NotFoundException('原料不存在');
    }

    const updateData: Partial<Ingredient> = { ...data };

    if (data.costPerUnit !== undefined && data.costPerUnit !== existingIngredient.costPerUnit) {
      const newCostHistory = [
        ...existingIngredient.costHistory,
        {
          cost: data.costPerUnit,
          date: new Date(),
        },
      ];
      updateData.costHistory = newCostHistory;
    }

    return this.ingredientModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Ingredient | null> {
    const ingredient = await this.ingredientModel.findByIdAndDelete(id).exec();
    if (!ingredient) {
      throw new NotFoundException('原料不存在');
    }
    return ingredient;
  }

  async updateStock(id: string, quantity: number): Promise<Ingredient | null> {
    const ingredient = await this.ingredientModel.findById(id).exec();
    if (!ingredient) {
      throw new NotFoundException('原料不存在');
    }

    const newStock = ingredient.currentStock + quantity;
    if (newStock < 0) {
      throw new BadRequestException('库存不足');
    }

    return this.ingredientModel
      .findByIdAndUpdate(id, { currentStock: newStock }, { new: true })
      .exec();
  }
}
