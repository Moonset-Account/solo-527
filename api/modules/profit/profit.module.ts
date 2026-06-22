import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfitService } from './profit.service.js';
import { ProfitController } from './profit.controller.js';
import { ProfitRecord, ProfitRecordSchema } from '../../schemas/profit-record.schema.js';
import { Batch, BatchSchema } from '../../schemas/batch.schema.js';
import { Recipe, RecipeSchema } from '../../schemas/recipe.schema.js';
import { ScrapRecord, ScrapRecordSchema } from '../../schemas/scrap-record.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProfitRecord.name, schema: ProfitRecordSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: Recipe.name, schema: RecipeSchema },
      { name: ScrapRecord.name, schema: ScrapRecordSchema },
    ]),
  ],
  controllers: [ProfitController],
  providers: [ProfitService],
  exports: [ProfitService],
})
export class ProfitModule {}
