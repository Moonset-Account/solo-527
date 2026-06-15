import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTask } from './entities/inspection-task.entity';
import { InspectionTasksService } from './inspection-tasks.service';
import { InspectionTasksController } from './inspection-tasks.controller';
import { InspectionTemplatesModule } from '../inspection-templates/inspection-templates.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([InspectionTask]),
    InspectionTemplatesModule,
    AuditLogsModule,
  ],
  controllers: [InspectionTasksController],
  providers: [InspectionTasksService],
  exports: [InspectionTasksService],
})
export class InspectionTasksModule {}
