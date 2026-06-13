import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowUpTask } from './entities/follow-up-task.entity';
import { FollowUpService } from './services/follow-up.service';
import { FollowUpController } from './controllers/follow-up.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FollowUpTask])],
  controllers: [FollowUpController],
  providers: [FollowUpService],
  exports: [FollowUpService],
})
export class FollowUpModule {}
