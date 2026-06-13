import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackDto, FeedbackFilterDto, FeedbackStatsDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { ExportService } from '../export/export.service.js';
import { AfterSaleService } from '../after-sale/after-sale.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { Project } from '../project/project.entity.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeedbackController {
  constructor(
    private feedbackService: FeedbackService,
    private exportService: ExportService,
    private afterSaleService: AfterSaleService,
    private notificationService: NotificationService,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
  ) {}

  @Post('projects/:projectId/feedbacks')
  async create(
    @Param('projectId') _projectId: string,
    @Request() req: any,
    @Body() dto: CreateFeedbackDto,
  ) {
    const feedback = await this.feedbackService.create(req.user.id, dto);

    if (dto.rating <= 2) {
      await this.autoCreateAfterSaleOrder(feedback);
    }

    const project = await this.projectRepo.findOne({ where: { id: dto.projectId } });
    if (project) {
      await this.notificationService.notifyRole(
        project.companyId,
        'owner',
        'feedback_received',
        `收到客户反馈 - ${dto.rating}星评价`,
        { projectId: dto.projectId, feedbackId: feedback.id }
      );
    }

    return feedback;
  }

  private async autoCreateAfterSaleOrder(feedback: any) {
    const stageLabels: Record<string, string> = {
      design: '设计阶段',
      construction: '施工阶段',
      completion: '竣工阶段',
    };

    await this.afterSaleService.create({
      projectId: feedback.projectId,
      title: `客户${stageLabels[feedback.stage] || ''}满意度低`,
      description: `客户评分: ${feedback.rating}星\n客户反馈: ${feedback.comment || '无详细描述'}`,
      status: 'pending',
      source: 'feedback',
      sourceId: feedback.id,
    });
  }

  @Get('feedbacks')
  @Roles('owner', 'worker')
  async findAll(@Query() filters: FeedbackFilterDto, @Request() req: any) {
    return this.feedbackService.findAll(filters, req.user.companyId);
  }

  @Get('feedbacks/stats')
  @Roles('owner', 'worker')
  async getStats(@Query() dto: FeedbackStatsDto, @Request() req: any) {
    return this.feedbackService.getStats(dto, req.user.companyId);
  }

  @Get('feedbacks/export')
  @Roles('owner', 'worker')
  async exportExcel(@Query() filters: FeedbackFilterDto, @Request() req: any, @Res() res: Response) {
    const data = await this.feedbackService.findAllForExport(filters, req.user.companyId);
    const buffer = this.exportService.exportFeedbacks(data);
    const filename = `客户满意度报表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(filename)}`);
    res.send(buffer);
  }
}
