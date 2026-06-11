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
import { BudgetService } from './budget.service.js';
import { CreateBudgetDto, UpdateBudgetDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class BudgetController {
  constructor(private budgetService: BudgetService) {}

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
    return this.budgetService.approve(id, req.user.role);
  }

  @Post('budgets/:id/reject')
  async reject(@Param('id') id: string, @Request() req: any) {
    return this.budgetService.reject(id, req.user.role);
  }

  @Post('budgets/:id/send-to-client')
  async sendToClient(@Param('id') id: string) {
    return this.budgetService.sendToClient(id);
  }

  @Get('budgets/:id/compare/:compareVersionId')
  async compare(
    @Param('id') id: string,
    @Param('compareVersionId') compareVersionId: string,
  ) {
    return this.budgetService.compare(id, compareVersionId);
  }
}
