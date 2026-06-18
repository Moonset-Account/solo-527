import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller.js';
import { SettingsService } from './settings.service.js';
import { Dict, DictSchema } from './dict.schema.js';
import { ReminderTemplate, ReminderTemplateSchema } from './reminder-template.schema.js';
import { ScopeConfig, ScopeConfigSchema } from './scope-config.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dict.name, schema: DictSchema },
      { name: ReminderTemplate.name, schema: ReminderTemplateSchema },
      { name: ScopeConfig.name, schema: ScopeConfigSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
