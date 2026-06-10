import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DesignPlan } from './design-plan.entity';
import { DesignPlanService } from './design-plan.service';
import { DesignPlanController } from './design-plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DesignPlan])],
  controllers: [DesignPlanController],
  providers: [DesignPlanService],
  exports: [DesignPlanService, TypeOrmModule],
})
export class DesignPlanModule {}
