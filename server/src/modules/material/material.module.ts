import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material, MaterialCost } from '../../entities';
import { MaterialService, MaterialCostService } from './material.service';
import { MaterialController, MaterialCostController } from './material.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material, MaterialCost]),
  ],
  providers: [
    MaterialService,
    MaterialCostService,
  ],
  controllers: [
    MaterialController,
    MaterialCostController,
  ],
  exports: [
    MaterialService,
    MaterialCostService,
  ],
})
export class MaterialModule {}
