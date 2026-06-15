import { Module } from '@nestjs/common';
import { ItemService } from './item.service.js';
import { ItemController } from './item.controller.js';
import { LogModule } from '../log/log.module.js';

@Module({
  imports: [LogModule],
  providers: [ItemService],
  controllers: [ItemController],
  exports: [ItemService],
})
export class ItemModule {}
