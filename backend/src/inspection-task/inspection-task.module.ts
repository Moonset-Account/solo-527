import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InspectionTask } from './inspection-task.entity';
import { InspectionTaskService } from './inspection-task.service';
import { InspectionTaskController } from './inspection-task.controller';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [TypeOrmModule.forFeature([InspectionTask]), ProjectModule],
  controllers: [InspectionTaskController],
  providers: [InspectionTaskService],
  exports: [InspectionTaskService, TypeOrmModule],
})
export class InspectionTaskModule {}
