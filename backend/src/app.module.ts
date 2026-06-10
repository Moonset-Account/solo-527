import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomerModule } from './customer/customer.module';
import { ProjectModule } from './project/project.module';
import { DesignPlanModule } from './design-plan/design-plan.module';
import { ContractModule } from './contract/contract.module';
import { HouseSurveyModule } from './house-survey/house-survey.module';
import { ConstructionStageModule } from './construction-stage/construction-stage.module';
import { StagePhotoModule } from './stage-photo/stage-photo.module';
import { CustomerFeedbackModule } from './customer-feedback/customer-feedback.module';
import { DelayReminderModule } from './delay-reminder/delay-reminder.module';
import { InspectionTaskModule } from './inspection-task/inspection-task.module';
import { AfterSalesModule } from './after-sales/after-sales.module';
import { MaterialCostModule } from './material-cost/material-cost.module';
import { ReportsModule } from './reports/reports.module';
import { ExportModule } from './export/export.module';
import { Customer } from './customer/customer.entity';
import { Project } from './project/project.entity';
import { DesignPlan } from './design-plan/design-plan.entity';
import { Contract } from './contract/contract.entity';
import { HouseSurvey } from './house-survey/house-survey.entity';
import { ConstructionStage } from './construction-stage/construction-stage.entity';
import { StagePhoto } from './stage-photo/stage-photo.entity';
import { CustomerFeedback } from './customer-feedback/customer-feedback.entity';
import { DelayReminder } from './delay-reminder/delay-reminder.entity';
import { InspectionTask } from './inspection-task/inspection-task.entity';
import { AfterSales } from './after-sales/after-sales.entity';
import { MaterialCost } from './material-cost/material-cost.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'decoration',
      entities: [
        Customer,
        Project,
        DesignPlan,
        Contract,
        HouseSurvey,
        ConstructionStage,
        StagePhoto,
        CustomerFeedback,
        DelayReminder,
        InspectionTask,
        AfterSales,
        MaterialCost,
      ],
      synchronize: true,
    }),
    CustomerModule,
    ProjectModule,
    DesignPlanModule,
    ContractModule,
    HouseSurveyModule,
    ConstructionStageModule,
    StagePhotoModule,
    CustomerFeedbackModule,
    DelayReminderModule,
    InspectionTaskModule,
    AfterSalesModule,
    MaterialCostModule,
    ReportsModule,
    ExportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
