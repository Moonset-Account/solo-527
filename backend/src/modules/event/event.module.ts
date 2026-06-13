import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { Event } from './entities/event.entity';
import { Attachment } from './entities/attachment.entity';
import { Note } from './entities/note.entity';
import { History } from './entities/history.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Attachment, Note, History, User]),
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
