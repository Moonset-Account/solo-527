import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatisticsService } from './statistics.service';
import { StatisticsController } from './statistics.controller';
import { EmailDraft, EmailDraftSchema } from '../email-drafts/schemas/email-draft.schema';
import { ReviewLog, ReviewLogSchema } from '../review-logs/schemas/review-log.schema';
import { CallLog, CallLogSchema } from '../call-logs/schemas/call-log.schema';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailDraft.name, schema: EmailDraftSchema },
      { name: ReviewLog.name, schema: ReviewLogSchema },
      { name: CallLog.name, schema: CallLogSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}
