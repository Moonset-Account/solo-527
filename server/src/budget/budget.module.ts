import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller.js';
import { BudgetService } from './budget.service.js';
import { Budget } from './budget.entity.js';
import { BudgetItem } from './budget-item.entity.js';
import { MaterialItem } from './material-item.entity.js';
import { Project } from '../project/project.entity.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget, BudgetItem, MaterialItem, Project]),
    NotificationModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
