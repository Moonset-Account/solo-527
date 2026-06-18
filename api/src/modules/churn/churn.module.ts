import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChurnController } from './churn.controller.js';
import { ChurnService } from './churn.service.js';
import { ChurnRecord, ChurnSchema } from './churn-record.schema.js';
import { Lead, LeadSchema } from '../leads/lead.schema.js';
import { Followup, FollowupSchema } from '../followups/followup.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChurnRecord.name, schema: ChurnSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Followup.name, schema: FollowupSchema },
    ]),
  ],
  controllers: [ChurnController],
  providers: [ChurnService],
  exports: [ChurnService],
})
export class ChurnModule {}
