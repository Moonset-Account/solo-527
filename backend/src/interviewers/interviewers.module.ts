import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewersService } from './interviewers.service';
import { InterviewersController } from './interviewers.controller';
import { Interviewer, InterviewerSchema } from './schemas/interviewer.schema';
import { Schedule, ScheduleSchema } from './schemas/schedule.schema';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interviewer.name, schema: InterviewerSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    OperationLogsModule,
  ],
  controllers: [InterviewersController],
  providers: [InterviewersService],
  exports: [InterviewersService],
})
export class InterviewersModule {}
