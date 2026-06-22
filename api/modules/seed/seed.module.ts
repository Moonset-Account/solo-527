import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service.js';
import { SeedController } from './seed.controller.js';
import { Batch, BatchSchema } from '../../schemas/batch.schema.js';
import { Recipe, RecipeSchema } from '../../schemas/recipe.schema.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';
import { Schedule, ScheduleSchema } from '../../schemas/schedule.schema.js';
import { InventoryLog, InventoryLogSchema } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord, ScrapRecordSchema } from '../../schemas/scrap-record.schema.js';
import { ProfitRecord, ProfitRecordSchema } from '../../schemas/profit-record.schema.js';
import { CostAnomaly, CostAnomalySchema } from '../../schemas/cost-anomaly.schema.js';
import { Team, TeamSchema } from '../../schemas/team.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Batch.name, schema: BatchSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: ScrapRecord.name, schema: ScrapRecordSchema },
      { name: ProfitRecord.name, schema: ProfitRecordSchema },
      { name: CostAnomaly.name, schema: CostAnomalySchema },
      { name: Team.name, schema: TeamSchema },
    ]),
  ],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
