import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReachLogService } from './reach-log.service';
import { ReachLogController } from './reach-log.controller';
import { ReachLog, ReachLogSchema } from './reach-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ReachLog.name, schema: ReachLogSchema }]),
  ],
  controllers: [ReachLogController],
  providers: [ReachLogService],
  exports: [ReachLogService],
})
export class ReachLogModule {}
