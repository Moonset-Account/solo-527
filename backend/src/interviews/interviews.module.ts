import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewsService } from './interviews.service';
import { InterviewsController } from './interviews.controller';
import { Interview, InterviewSchema } from './schemas/interview.schema';
import { Schedule, ScheduleSchema } from '../interviewers/schemas/schedule.schema';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { InterviewersModule } from '../interviewers/interviewers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    OperationLogsModule,
    forwardRef(() => InterviewersModule),
  ],
  controllers: [InterviewsController],
  providers: [InterviewsService],
  exports: [InterviewsService, MongooseModule],
})
export class InterviewsModule {}
