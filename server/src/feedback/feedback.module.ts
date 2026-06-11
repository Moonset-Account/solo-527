import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { Feedback } from './feedback.entity.js';
import { ExportModule } from '../export/export.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Feedback]), ExportModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
