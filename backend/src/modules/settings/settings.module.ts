import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingSchema } from './setting.schema';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Setting', schema: SettingSchema }])],
  providers: [SettingsService],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule implements OnModuleInit {
  constructor(private settingsService: SettingsService) {}

  async onModuleInit() {
    await this.settingsService.initDefaultSettings();
  }
}
