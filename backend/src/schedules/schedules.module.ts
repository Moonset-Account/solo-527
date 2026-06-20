import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from '../interviewers/schemas/schedule.schema';
import { InterviewersModule } from '../interviewers/interviewers.module';
import { InterviewsModule } from '../interviews/interviews.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Schedule.name, schema: ScheduleSchema }]),
    forwardRef(() => InterviewersModule),
    forwardRef(() => InterviewsModule),
  ],
  exports: [MongooseModule],
})
export class SchedulesModule {}
