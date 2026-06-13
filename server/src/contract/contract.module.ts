import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller.js';
import { ContractService } from './contract.service.js';
import { Contract } from './contract.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { Project } from '../project/project.entity.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Budget, Project]),
    NotificationModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
