import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportRecord } from './entities/export-record.entity.js';
import { ExportService } from './export.service.js';
import { ExportController } from './export.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ExportRecord])],
  providers: [ExportService],
  controllers: [ExportController],
})
export class ExportModule {}
