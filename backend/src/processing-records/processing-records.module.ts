import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProcessingRecord } from './entities/processing-record.entity';
import { ProcessingRecordsService } from './processing-records.service';
import { ProcessingRecordsController } from './processing-records.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([ProcessingRecord]), AuditLogsModule],
  controllers: [ProcessingRecordsController],
  providers: [ProcessingRecordsService],
  exports: [ProcessingRecordsService],
})
export class ProcessingRecordsModule {}
