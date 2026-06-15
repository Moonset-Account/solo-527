import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTemplate } from './entities/inspection-template.entity';
import { InspectionTemplatesService } from './inspection-templates.service';
import { InspectionTemplatesController } from './inspection-templates.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionTemplate]), AuditLogsModule],
  controllers: [InspectionTemplatesController],
  providers: [InspectionTemplatesService],
  exports: [InspectionTemplatesService],
})
export class InspectionTemplatesModule {}
