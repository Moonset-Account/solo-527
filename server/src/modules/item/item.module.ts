import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemService } from './item.service.js';
import { ItemController } from './item.controller.js';
import { LogModule } from '../log/log.module.js';
import { ItemSchema } from '../../schemas/item.schema.js';
import { ProgressSchema } from '../../schemas/progress.schema.js';
import { AttachmentSchema } from '../../schemas/attachment.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Item', schema: ItemSchema },
      { name: 'Progress', schema: ProgressSchema },
      { name: 'Attachment', schema: AttachmentSchema },
    ]),
    LogModule,
  ],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
