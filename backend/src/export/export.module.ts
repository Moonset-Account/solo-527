import { Module } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ProjectModule } from '../project/project.module';
import { CustomerModule } from '../customer/customer.module';
import { DesignPlanModule } from '../design-plan/design-plan.module';
import { ContractModule } from '../contract/contract.module';
import { HouseSurveyModule } from '../house-survey/house-survey.module';
import { ConstructionStageModule } from '../construction-stage/construction-stage.module';
import { CustomerFeedbackModule } from '../customer-feedback/customer-feedback.module';
import { AfterSalesModule } from '../after-sales/after-sales.module';
import { InspectionTaskModule } from '../inspection-task/inspection-task.module';
import { DelayReminderModule } from '../delay-reminder/delay-reminder.module';
import { StagePhotoModule } from '../stage-photo/stage-photo.module';
import { MaterialCostModule } from '../material-cost/material-cost.module';

@Module({
  imports: [
    ProjectModule,
    CustomerModule,
    DesignPlanModule,
    ContractModule,
    HouseSurveyModule,
    ConstructionStageModule,
    CustomerFeedbackModule,
    AfterSalesModule,
    InspectionTaskModule,
    DelayReminderModule,
    StagePhotoModule,
    MaterialCostModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
