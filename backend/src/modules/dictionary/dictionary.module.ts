import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DictionaryItemSchema } from './dictionary.schema';
import { DictionaryService } from './dictionary.service';
import { DictionaryController } from './dictionary.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'DictionaryItem', schema: DictionaryItemSchema }])],
  providers: [DictionaryService],
  controllers: [DictionaryController],
  exports: [DictionaryService],
})
export class DictionaryModule {}
