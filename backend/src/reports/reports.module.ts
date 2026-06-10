import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ProjectModule } from '../project/project.module';
import { MaterialCostModule } from '../material-cost/material-cost.module';
import { DesignPlanModule } from '../design-plan/design-plan.module';
import { ContractModule } from '../contract/contract.module';
import { HouseSurveyModule } from '../house-survey/house-survey.module';
import { ConstructionStageModule } from '../construction-stage/construction-stage.module';
import { CustomerFeedbackModule } from '../customer-feedback/customer-feedback.module';
import { AfterSalesModule } from '../after-sales/after-sales.module';
import { InspectionTaskModule } from '../inspection-task/inspection-task.module';
import { DelayReminderModule } from '../delay-reminder/delay-reminder.module';
import { StagePhotoModule } from '../stage-photo/stage-photo.module';
import { Project } from '../project/project.entity';
import { MaterialCost } from '../material-cost/material-cost.entity';
import { ConstructionStage } from '../construction-stage/construction-stage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, MaterialCost, ConstructionStage]),
    ProjectModule,
    MaterialCostModule,
    DesignPlanModule,
    ContractModule,
    HouseSurveyModule,
    ConstructionStageModule,
    CustomerFeedbackModule,
    AfterSalesModule,
    InspectionTaskModule,
    DelayReminderModule,
    StagePhotoModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
