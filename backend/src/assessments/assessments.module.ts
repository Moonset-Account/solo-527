import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssessmentsService } from './assessments.service';
import { AssessmentsController } from './assessments.controller';
import { Assessment, AssessmentSchema } from './schemas/assessment.schema';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { InterviewsModule } from '../interviews/interviews.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assessment.name, schema: AssessmentSchema },
      { name: Interview.name, schema: InterviewSchema },
    ]),
    OperationLogsModule,
    forwardRef(() => InterviewsModule),
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
