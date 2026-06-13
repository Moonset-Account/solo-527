import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { Event } from '../event/entities/event.entity';
import { Task } from '../task/entities/task.entity';
import { Todo } from '../todo/entities/todo.entity';
import { Vote } from '../vote/entities/vote.entity';
import { User } from '../user/entities/user.entity';
import { VoteRecord } from '../vote/entities/vote-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Task, Todo, Vote, User, VoteRecord]),
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
