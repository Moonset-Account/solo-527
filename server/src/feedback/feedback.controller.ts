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
import { FeedbackService } from './feedback.service.js';
import { CreateFeedbackDto, FeedbackFilterDto } from './dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ExportService } from '../export/export.service.js';

@Controller()
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class FeedbackController {
  constructor(
    private feedbackService: FeedbackService,
    private exportService: ExportService,
  ) {}

  @Post('projects/:projectId/feedbacks')
  async create(
    @Param('projectId') _projectId: string,
    @Request() req: any,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.create(req.user.id, dto);
  }

  @Get('feedbacks')
  async findAll(@Query() filters: FeedbackFilterDto) {
    return this.feedbackService.findAll(filters);
  }

  @Get('feedbacks/export')
  async exportExcel(@Query() filters: FeedbackFilterDto, @Res() res: Response) {
    const data = await this.feedbackService.findAllForExport(filters);
    const buffer = this.exportService.exportFeedbacks(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=feedbacks.xlsx');
    res.send(buffer);
  }
}
