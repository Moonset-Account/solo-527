import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoteController } from './vote.controller';
import { VoteService } from './vote.service';
import { Vote } from './entities/vote.entity';
import { VoteRecord } from './entities/vote-record.entity';
import { VoteRule } from './entities/vote-rule.entity';
import { User } from '../user/entities/user.entity';
import { Todo } from '../todo/entities/todo.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vote, VoteRecord, VoteRule, User, Todo]),
  ],
  controllers: [VoteController],
  providers: [VoteService],
  exports: [VoteService],
})
export class VoteModule {}
