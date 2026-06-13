import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../project/project.entity.js';
import { Budget } from '../budget/budget.entity.js';
import { AfterSaleOrder } from '../after-sale/after-sale.entity.js';
import { Notification } from './notification.entity.js';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(Budget)
    private budgetRepo: Repository<Budget>,
    @InjectRepository(AfterSaleOrder)
    private afterSaleRepo: Repository<AfterSaleOrder>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
  ) {}

  @Get()
  async findByUser(@Request() req: any) {
    return this.notificationService.findByUser(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationRepo.count({
      where: { userId: req.user.id, read: false },
    });
    return { count };
  }

  @Get('dashboard-stats')
  async getDashboardStats(@Request() req: any) {
    const companyId = req.user.companyId;

    const activeProjects = await this.projectRepo.count({
      where: { companyId, status: 'constructing' },
    });

    const pendingBudgets = await this.budgetRepo.count({
      where: { status: 'pending_review' },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyAfterSaleOrders = await this.afterSaleRepo
      .createQueryBuilder('o')
      .leftJoin('o.project', 'project')
      .where('project.company_id = :companyId', { companyId })
      .andWhere('o.created_at >= :startOfMonth', { startOfMonth })
      .getCount();

    const unreadNotifications = await this.notificationRepo.count({
      where: { userId: req.user.id, read: false },
    });

    return {
      activeProjects,
      pendingBudgets,
      monthlyAfterSaleOrders,
      unreadNotifications,
    };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Post('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }
}
