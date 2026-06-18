import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { Contract, ContractSchema } from './contract.schema.js';
import { Lead, LeadSchema } from '../leads/lead.schema.js';
import { Followup, FollowupSchema } from '../followups/followup.schema.js';
import { Prediction, PredictionSchema } from '../predictions/prediction.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contract.name, schema: ContractSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Followup.name, schema: FollowupSchema },
      { name: Prediction.name, schema: PredictionSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
