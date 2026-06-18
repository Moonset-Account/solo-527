import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PredictionsController } from './predictions.controller.js';
import { PredictionsService } from './predictions.service.js';
import { Prediction, PredictionSchema } from './prediction.schema.js';
import { Lead, LeadSchema } from '../leads/lead.schema.js';
import { Followup, FollowupSchema } from '../followups/followup.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prediction.name, schema: PredictionSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Followup.name, schema: FollowupSchema },
    ]),
  ],
  controllers: [PredictionsController],
  providers: [PredictionsService],
  exports: [PredictionsService],
})
export class PredictionsModule {}
