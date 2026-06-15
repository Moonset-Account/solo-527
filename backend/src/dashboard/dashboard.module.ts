import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { Fault } from '../faults/entities/fault.entity';
import { InspectionTask } from '../inspection-tasks/entities/inspection-task.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Application, Fault, InspectionTask])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
