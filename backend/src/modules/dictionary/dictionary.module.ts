import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dictionary, DictionarySchema } from './schemas/dictionary.schema';
import { NotificationConfig, NotificationConfigSchema } from './schemas/notification-config.schema';
import { DictionaryService } from './dictionary.service';
import { DictionaryController } from './dictionary.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dictionary.name, schema: DictionarySchema },
      { name: NotificationConfig.name, schema: NotificationConfigSchema },
    ]),
  ],
  controllers: [DictionaryController],
  providers: [DictionaryService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
