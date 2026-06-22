import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnomaliesService } from './anomalies.service.js';
import { AnomaliesController } from './anomalies.controller.js';
import { CostAnomaly, CostAnomalySchema } from '../../schemas/cost-anomaly.schema.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';
import { Batch, BatchSchema } from '../../schemas/batch.schema.js';
import { ScrapRecord, ScrapRecordSchema } from '../../schemas/scrap-record.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CostAnomaly.name, schema: CostAnomalySchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Batch.name, schema: BatchSchema },
      { name: ScrapRecord.name, schema: ScrapRecordSchema },
    ]),
  ],
  controllers: [AnomaliesController],
  providers: [AnomaliesService],
  exports: [AnomaliesService],
})
export class AnomaliesModule {}
