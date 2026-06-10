import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DesignPlan } from '../design-plan/design-plan.entity';
import { InspectionTask } from '../inspection-task/inspection-task.entity';
import { AfterSales } from '../after-sales/after-sales.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Project, DesignPlan, InspectionTask, AfterSales])],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService, TypeOrmModule],
})
export class ProjectModule {}
