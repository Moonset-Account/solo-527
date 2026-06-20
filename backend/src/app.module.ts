import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from './config/config.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { InterviewersModule } from './interviewers/interviewers.module';
import { SchedulesModule } from './schedules/schedules.module';
import { InterviewsModule } from './interviews/interviews.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { AssessmentsModule } from './assessments/assessments.module';
import { RemindersModule } from './reminders/reminders.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/interview-system'),
    ScheduleModule.forRoot(),
    ConfigModule,
    RedisModule,
    AuthModule,
    UsersModule,
    InterviewersModule,
    SchedulesModule,
    InterviewsModule,
    QuestionBankModule,
    AssessmentsModule,
    RemindersModule,
    OperationLogsModule,
    ExportsModule,
  ],
})
export class AppModule {}
