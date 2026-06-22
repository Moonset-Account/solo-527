import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryLog, InventoryLogSchema } from '../../schemas/inventory-log.schema.js';
import { ScrapRecord, ScrapRecordSchema } from '../../schemas/scrap-record.schema.js';
import { Ingredient, IngredientSchema } from '../../schemas/ingredient.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: InventoryLog.name, schema: InventoryLogSchema },
      { name: ScrapRecord.name, schema: ScrapRecordSchema },
      { name: Ingredient.name, schema: IngredientSchema },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
