import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportRecord } from '../../entities';
import { SystemConfigModule } from '../system-config/system-config.module';
import { OrderModule } from '../order/order.module';
import { ExportRecordService, OrderExportService } from './export.service';
import { ExportController } from './export.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExportRecord]),
    SystemConfigModule,
    OrderModule,
  ],
  providers: [ExportRecordService, OrderExportService],
  controllers: [ExportController],
  exports: [ExportRecordService, OrderExportService],
})
export class ExportModule {}
