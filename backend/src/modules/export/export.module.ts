import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ExportQueue, Bill, CollectionRecord, CashForecast, Reconciliation, Invoice } from '@/database/entities';
import { ExportService } from './export.service';
import { ExportController } from './export.controller';
import { ExportProcessor } from './export.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExportQueue, Bill, CollectionRecord, CashForecast, Reconciliation, Invoice]),
    BullModule.registerQueue({ name: 'export' }),
  ],
  controllers: [ExportController],
  providers: [ExportService, ExportProcessor],
  exports: [ExportService],
})
export class ExportModule {}
