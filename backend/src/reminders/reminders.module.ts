import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RemindersService } from './reminders.service';
import { RemindersController } from './reminders.controller';
import { Reminder, ReminderSchema } from './schemas/reminder.schema';
import { ReminderConfig, ReminderConfigSchema } from './schemas/reminder-config.schema';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Schedule, ScheduleSchema } from '../interviewers/schemas/schedule.schema';
import { Assessment, AssessmentSchema } from '../assessments/schemas/assessment.schema';
import { InterviewsModule } from '../interviews/interviews.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: ReminderConfig.name, schema: ReminderConfigSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: User.name, schema: UserSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
    forwardRef(() => InterviewsModule),
    forwardRef(() => UsersModule),
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
