import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { ReviewFlow, ReviewFlowSchema } from './schemas/review-flow.schema';
import { ReviewRecord, ReviewRecordSchema } from './schemas/review-record.schema';
import { Content, ContentSchema } from '../content/schemas/content.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReviewFlow.name, schema: ReviewFlowSchema },
      { name: ReviewRecord.name, schema: ReviewRecordSchema },
      { name: Content.name, schema: ContentSchema },
    ]),
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
