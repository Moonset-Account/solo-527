import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerFeedback } from './customer-feedback.entity';
import { CustomerFeedbackService } from './customer-feedback.service';
import { CustomerFeedbackController } from './customer-feedback.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerFeedback])],
  controllers: [CustomerFeedbackController],
  providers: [CustomerFeedbackService],
  exports: [CustomerFeedbackService, TypeOrmModule],
})
export class CustomerFeedbackModule {}
