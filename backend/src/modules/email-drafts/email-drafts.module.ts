import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmailDraftsService } from './email-drafts.service';
import { EmailDraftsController } from './email-drafts.controller';
import { EmailDraft, EmailDraftSchema } from './schemas/email-draft.schema';
import { EmailVersion, EmailVersionSchema } from '../email-versions/schemas/email-version.schema';
import { ReviewLog, ReviewLogSchema } from '../review-logs/schemas/review-log.schema';
import { UsersModule } from '../users/users.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailDraft.name, schema: EmailDraftSchema },
      { name: EmailVersion.name, schema: EmailVersionSchema },
      { name: ReviewLog.name, schema: ReviewLogSchema },
    ]),
    UsersModule,
    JwtModule,
  ],
  controllers: [EmailDraftsController],
  providers: [EmailDraftsService],
  exports: [EmailDraftsService, MongooseModule],
})
export class EmailDraftsModule {}
