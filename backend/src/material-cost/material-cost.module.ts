import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialCost } from './material-cost.entity';
import { MaterialCostService } from './material-cost.service';
import { MaterialCostController } from './material-cost.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialCost])],
  controllers: [MaterialCostController],
  providers: [MaterialCostService],
  exports: [MaterialCostService, TypeOrmModule],
})
export class MaterialCostModule {}
