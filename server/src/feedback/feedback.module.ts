import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedbackController } from './feedback.controller.js';
import { FeedbackService } from './feedback.service.js';
import { Feedback } from './feedback.entity.js';
import { Project } from '../project/project.entity.js';
import { ExportModule } from '../export/export.module.js';
import { AfterSaleModule } from '../after-sale/after-sale.module.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Feedback, Project]),
    ExportModule,
    AfterSaleModule,
    NotificationModule,
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
