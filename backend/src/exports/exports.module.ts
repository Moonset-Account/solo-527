import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { Interview, InterviewSchema } from '../interviews/schemas/interview.schema';
import { Assessment, AssessmentSchema } from '../assessments/schemas/assessment.schema';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';
import { InterviewsModule } from '../interviews/interviews.module';
import { AssessmentsModule } from '../assessments/assessments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: Assessment.name, schema: AssessmentSchema },
    ]),
    OperationLogsModule,
    forwardRef(() => InterviewsModule),
    forwardRef(() => AssessmentsModule),
  ],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
