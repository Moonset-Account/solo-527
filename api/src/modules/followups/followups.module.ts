import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowupsController } from './followups.controller.js';
import { FollowupRulesController } from './followup-rules.controller.js';
import { FollowupsService } from './followups.service.js';
import { FollowupRulesService } from './followup-rules.service.js';
import { Followup, FollowupSchema } from './followup.schema.js';
import { FollowupRule, FollowupRuleSchema } from './followup-rule.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Followup.name, schema: FollowupSchema },
      { name: FollowupRule.name, schema: FollowupRuleSchema },
    ]),
  ],
  controllers: [FollowupsController, FollowupRulesController],
  providers: [FollowupsService, FollowupRulesService],
  exports: [FollowupsService, FollowupRulesService],
})
export class FollowupsModule {}
