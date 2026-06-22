import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Recipe } from '../../schemas/recipe.schema.js';
import { Ingredient } from '../../schemas/ingredient.schema.js';
import { PaginatedResult, createPaginatedResult } from '../../common/dto/pagination.dto.js';

@Injectable()
export class RecipesService {
  constructor(
    @InjectModel(Recipe.name) private recipeModel: Model<Recipe>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
  ) {}

  async findAll(
    isSandbox = false,
    options: {
      keyword?: string;
      category?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ): Promise<PaginatedResult<Recipe>> {
    const { keyword, category, page = 1, pageSize = 10 } = options;
    const filter: FilterQuery<Recipe> = { isSandbox };

    if (keyword) {
      filter.name = { $regex: keyword, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.recipeModel.find(filter).skip(skip).limit(pageSize).sort({ createdAt: -1 }).exec(),
      this.recipeModel.countDocuments(filter).exec(),
    ]);

    return createPaginatedResult(items, total, page, pageSize);
  }

  async findOne(id: string): Promise<Recipe | null> {
    const recipe = await this.recipeModel.findById(id).exec();
    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }
    return recipe;
  }

  async calculateStandardCost(
    ingredients: { ingredientId: string; ratio: number }[],
    isSandbox = false,
  ): Promise<number> {
    if (!ingredients || ingredients.length === 0) {
      return 0;
    }

    const ingredientIds = ingredients.map((ing) => ing.ingredientId);
    const ingredientDocs = await this.ingredientModel
      .find({ _id: { $in: ingredientIds }, isSandbox })
      .exec();

    const costMap = new Map<string, number>();
    ingredientDocs.forEach((ing) => {
      costMap.set(ing._id.toString(), ing.costPerUnit);
    });

    let totalCost = 0;
    for (const ing of ingredients) {
      const unitCost = costMap.get(ing.ingredientId) || 0;
      totalCost += unitCost * ing.ratio;
    }

    return totalCost;
  }

  async create(data: Partial<Recipe> & { isSandbox?: boolean }): Promise<Recipe> {
    const isSandbox = data.isSandbox ?? false;

    const standardCost = await this.calculateStandardCost(
      data.ingredients || [],
      isSandbox,
    );

    const recipeData = {
      ...data,
      isSandbox,
      standardCost,
      history: [],
    };

    return this.recipeModel.create(recipeData);
  }

  async update(id: string, data: Partial<Recipe>): Promise<Recipe | null> {
    const existingRecipe = await this.recipeModel.findById(id).exec();
    if (!existingRecipe) {
      throw new NotFoundException('配方不存在');
    }

    const history: { field: string; oldValue: string; newValue: string; changedAt: Date }[] = [];
    const now = new Date();

    const comparableFields: (keyof Recipe)[] = ['name', 'category', 'yield', 'unit'];
    for (const field of comparableFields) {
      if (data[field] !== undefined && data[field] !== existingRecipe[field]) {
        history.push({
          field,
          oldValue: String(existingRecipe[field]),
          newValue: String(data[field]),
          changedAt: now,
        });
      }
    }

    if (data.ingredients !== undefined) {
      const oldIngredientsStr = JSON.stringify(existingRecipe.ingredients);
      const newIngredientsStr = JSON.stringify(data.ingredients);
      if (oldIngredientsStr !== newIngredientsStr) {
        history.push({
          field: 'ingredients',
          oldValue: oldIngredientsStr,
          newValue: newIngredientsStr,
          changedAt: now,
        });
      }
    }

    let standardCost = existingRecipe.standardCost;
    if (data.ingredients !== undefined) {
      standardCost = await this.calculateStandardCost(
        data.ingredients,
        existingRecipe.isSandbox,
      );
      if (standardCost !== existingRecipe.standardCost) {
        history.push({
          field: 'standardCost',
          oldValue: String(existingRecipe.standardCost),
          newValue: String(standardCost),
          changedAt: now,
        });
      }
    }

    const updateData: Partial<Recipe> = {
      ...data,
      standardCost,
    };

    if (history.length > 0) {
      updateData.history = [...existingRecipe.history, ...history];
    }

    return this.recipeModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Recipe | null> {
    const recipe = await this.recipeModel.findByIdAndDelete(id).exec();
    if (!recipe) {
      throw new NotFoundException('配方不存在');
    }
    return recipe;
  }
}
