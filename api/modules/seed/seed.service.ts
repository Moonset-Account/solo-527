import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Batch } from '../schemas/batch.schema.js';
import { Recipe } from '../schemas/recipe.schema.js';
import { Ingredient } from '../schemas/ingredient.schema.js';
import { Schedule } from '../schemas/schedule.schema.js';
import { InventoryLog } from '../schemas/inventory-log.schema.js';
import { ScrapRecord } from '../schemas/scrap-record.schema.js';
import { ProfitRecord } from '../schemas/profit-record.schema.js';
import { CostAnomaly } from '../schemas/cost-anomaly.schema.js';
import { Team } from '../schemas/team.schema.js';
import {
  mockBatches,
  mockRecipes,
  mockIngredients,
  mockSchedules,
  mockInventoryLogs,
  mockScrapRecords,
  mockProfitRecords,
  mockAnomalies,
  mockTeams,
} from '../mock/data.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(Batch.name) private batchModel: Model<Batch>,
    @InjectModel(Recipe.name) private recipeModel: Model<Recipe>,
    @InjectModel(Ingredient.name) private ingredientModel: Model<Ingredient>,
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
    @InjectModel(InventoryLog.name) private inventoryLogModel: Model<InventoryLog>,
    @InjectModel(ScrapRecord.name) private scrapRecordModel: Model<ScrapRecord>,
    @InjectModel(ProfitRecord.name) private profitRecordModel: Model<ProfitRecord>,
    @InjectModel(CostAnomaly.name) private anomalyModel: Model<CostAnomaly>,
    @InjectModel(Team.name) private teamModel: Model<Team>,
  ) {}

  async seed() {
    try {
      await this.batchModel.deleteMany({ isSandbox: true });
      await this.recipeModel.deleteMany({ isSandbox: true });
      await this.ingredientModel.deleteMany({ isSandbox: true });
      await this.scheduleModel.deleteMany({ isSandbox: true });
      await this.inventoryLogModel.deleteMany({ isSandbox: true });
      await this.scrapRecordModel.deleteMany({ isSandbox: true });
      await this.profitRecordModel.deleteMany({ isSandbox: true });
      await this.anomalyModel.deleteMany({ isSandbox: true });
      await this.teamModel.deleteMany({ isSandbox: true });

      await this.teamModel.create(mockTeams);
      await this.ingredientModel.create(mockIngredients);
      await this.recipeModel.create(mockRecipes);
      await this.batchModel.create(mockBatches);
      await this.scheduleModel.create(mockSchedules);
      await this.inventoryLogModel.create(mockInventoryLogs);
      await this.scrapRecordModel.create(mockScrapRecords);
      await this.profitRecordModel.create(mockProfitRecords);
      await this.anomalyModel.create(mockAnomalies);

      this.logger.log('Seed data inserted into MongoDB');
      return { success: true, message: 'Seed data inserted' };
    } catch (err) {
      this.logger.warn('MongoDB seed failed, using mock data fallback');
      return { success: false, message: 'MongoDB unavailable, using mock data' };
    }
  }
}
