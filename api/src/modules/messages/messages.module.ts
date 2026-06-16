import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageRecord } from '../../entities/message-record.entity.js';
import { MessagesController } from './messages.controller.js';
import { MessagesService } from './messages.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MessageRecord])],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
