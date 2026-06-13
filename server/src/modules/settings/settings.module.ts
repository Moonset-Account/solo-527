import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { DictItem, DictItemSchema } from './schemas/dict-item.schema';
import { SystemConfig, SystemConfigSchema } from './schemas/system-config.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DictItem.name, schema: DictItemSchema },
      { name: SystemConfig.name, schema: SystemConfigSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
