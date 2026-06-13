import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetService } from './budget.service.js';
import { CreateBudgetDto, UpdateBudgetDto, RejectBudgetDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Project } from '../project/project.entity.js';
import { NotificationService } from '../notification/notification.service.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BudgetController {
  constructor(
    private budgetService: BudgetService,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    private notificationService: NotificationService,
  ) {}

  @Get('projects/:projectId/budgets')
  async findByProject(@Param('projectId') projectId: string) {
    return this.budgetService.findByProject(projectId);
  }

  @Post('projects/:projectId/budgets')
  async create(
    @Param('projectId') projectId: string,
    @Request() req: any,
    @Body() dto: CreateBudgetDto,
  ) {
    return this.budgetService.create(projectId, req.user.id, dto);
  }

  @Get('budgets/:id')
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Patch('budgets/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(id, dto);
  }

  @Post('budgets/:id/submit')
  async submit(@Param('id') id: string, @Request() req: any) {
    return this.budgetService.submit(id, req.user.companyId);
  }

  @Post('budgets/:id/approve')
  async approve(@Param('id') id: string, @Request() req: any) {
    return this.budgetService.approve(id, req.user.role, req.user.companyId);
  }

  @Post('budgets/:id/reject')
  async reject(@Param('id') id: string, @Request() req: any, @Body() dto: RejectBudgetDto) {
    return this.budgetService.reject(id, req.user.role, req.user.companyId, dto.reason);
  }

  @Post('budgets/:id/send-to-client')
  async sendToClient(@Param('id') id: string, @Request() req: any) {
    return this.budgetService.sendToClient(id, req.user.companyId);
  }

  @Get('budgets/:id/compare/:compareVersionId')
  async compare(
    @Param('id') id: string,
    @Param('compareVersionId') compareVersionId: string,
  ) {
    return this.budgetService.compare(id, compareVersionId);
  }

  @Patch('budget-items/:id')
  async updateBudgetItem(
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.budgetService.updateBudgetItem(id, dto);
  }

  @Post('budgets/:id/confirm')
  async confirmByClient(@Param('id') id: string, @Request() req: any) {
    const budget = await this.budgetService.findOne(id);
    if (budget.status !== 'sent_to_client') {
      throw new Error('Only sent budgets can be confirmed');
    }

    await this.budgetService.approve(id, 'owner', req.user.companyId);

    await this.projectRepo.update(budget.projectId, {
      status: 'confirmed',
      updatedAt: new Date(),
    });

    const project = await this.projectRepo.findOne({ where: { id: budget.projectId } });
    if (project) {
      await this.notificationService.notifyRole(
        project.companyId,
        'owner',
        'budget_change',
        `客户已确认预算 - ${project.name}`,
        { projectId: budget.projectId, budgetId: id }
      );
      await this.notificationService.notifyRole(
        project.companyId,
        'worker',
        'budget_change',
        `客户已确认预算，可以生成合同 - ${project.name}`,
        { projectId: budget.projectId, budgetId: id }
      );
    }

    return { message: 'Budget confirmed successfully' };
  }

  @Post('budgets/:id/request-changes')
  async requestChanges(@Param('id') id: string, @Body() dto: RejectBudgetDto, @Request() req: any) {
    const budget = await this.budgetService.findOne(id);
    if (budget.status !== 'sent_to_client') {
      throw new Error('Only sent budgets can be rejected');
    }

    await this.budgetService.reject(id, 'owner', req.user.companyId, dto.reason);

    const project = await this.projectRepo.findOne({ where: { id: budget.projectId } });
    if (project) {
      await this.notificationService.notifyRole(
        project.companyId,
        'owner',
        'budget_change',
        `客户请求修改预算 - ${project.name}`,
        { projectId: budget.projectId, budgetId: id }
      );
    }

    return { message: 'Change request sent successfully' };
  }
}
