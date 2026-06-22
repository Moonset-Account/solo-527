import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BatchesService } from './batches.service.js';
import { BatchesController } from './batches.controller.js';
import { Batch, BatchSchema } from '../../schemas/batch.schema.js';
import { Recipe, RecipeSchema } from '../../schemas/recipe.schema.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';
import { InventoryLog, InventoryLogSchema } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord, ScrapRecordSchema } from '../../schemas/scrap-record.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Batch.name, schema: BatchSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: ScrapRecord.name, schema: ScrapRecordSchema },
    ]),
  ],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
