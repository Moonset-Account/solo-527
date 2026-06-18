import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.js';
import { User, UserSchema } from './modules/users/user.schema.js';
import { Lead, LeadSchema } from './modules/leads/lead.schema.js';
import { Followup, FollowupSchema } from './modules/followups/followup.schema.js';
import { FollowupRule, FollowupRuleSchema } from './modules/followups/followup-rule.schema.js';
import { Prediction, PredictionSchema } from './modules/predictions/prediction.schema.js';
import { ChurnRecord, ChurnSchema } from './modules/churn/churn-record.schema.js';
import { Tag, TagSchema } from './modules/tags/tag.schema.js';
import { Contract, ContractSchema } from './modules/reports/contract.schema.js';
import { Dict, DictSchema } from './modules/settings/dict.schema.js';
import { ReminderTemplate, ReminderTemplateSchema } from './modules/settings/reminder-template.schema.js';
import { ScopeConfig, ScopeConfigSchema } from './modules/settings/scope-config.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: Followup.name, schema: FollowupSchema },
      { name: FollowupRule.name, schema: FollowupRuleSchema },
      { name: Prediction.name, schema: PredictionSchema },
      { name: ChurnRecord.name, schema: ChurnSchema },
      { name: Tag.name, schema: TagSchema },
      { name: Contract.name, schema: ContractSchema },
      { name: Dict.name, schema: DictSchema },
      { name: ReminderTemplate.name, schema: ReminderTemplateSchema },
      { name: ScopeConfig.name, schema: ScopeConfigSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
