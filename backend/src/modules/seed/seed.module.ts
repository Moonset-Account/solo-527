import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedController } from './seed.controller';
import { User } from '../user/entities/user.entity';
import { VoteRule } from '../vote/entities/vote-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VoteRule]),
  ],
  controllers: [SeedController],
})
export class SeedModule {}
