import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimelinesService } from './timelines.service';
import { TimelinesController } from './timelines.controller';
import { Timeline } from './entities/timeline.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Timeline])],
  controllers: [TimelinesController],
  providers: [TimelinesService],
  exports: [TypeOrmModule, TimelinesService],
})
export class TimelinesModule {}
