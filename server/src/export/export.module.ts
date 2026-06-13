import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller.js';
import { ExportService } from './export.service.js';
import { Budget } from '../budget/budget.entity.js';
import { ExportLog } from './export-log.entity.js';
import { FeedbackModule } from '../feedback/feedback.module.js';
import { AfterSaleModule } from '../after-sale/after-sale.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, ExportLog]),
    FeedbackModule,
    AfterSaleModule,
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
