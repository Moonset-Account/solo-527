import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestionBankService } from './question-bank.service';
import { QuestionBankController } from './question-bank.controller';
import { Question, QuestionSchema } from './schemas/question.schema';
import { OperationLogsModule } from '../operation-logs/operation-logs.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Question.name, schema: QuestionSchema }]),
    OperationLogsModule,
  ],
  controllers: [QuestionBankController],
  providers: [QuestionBankService],
  exports: [QuestionBankService],
})
export class QuestionBankModule implements OnModuleInit {
  constructor(private questionBankService: QuestionBankService) {}

  async onModuleInit() {
    await this.questionBankService.initDefaultQuestions();
  }
}
