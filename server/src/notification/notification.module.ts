import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';
import { NotificationGateway } from './notification.gateway.js';
import { Notification } from './notification.entity.js';
import { User } from '../common/user.entity.js';
import { Project } from '../project/project.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { AfterSaleOrder } from '../after-sale/after-sale.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Project, Budget, AfterSaleOrder])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
