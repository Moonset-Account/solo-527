import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ExportService } from './export.service.js';
import { FeedbackService } from '../feedback/feedback.service.js';
import { AfterSaleService } from '../after-sale/after-sale.service.js';
import { FeedbackFilterDto } from '../feedback/dto.js';
import { AfterSaleFilterDto } from '../after-sale/dto.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Controller('export')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExportController {
  constructor(
    private exportService: ExportService,
    private feedbackService: FeedbackService,
    private afterSaleService: AfterSaleService,
  ) {}

  @Get('feedbacks')
  async exportFeedbacks(@Query() filters: FeedbackFilterDto, @Res() res: Response) {
    const data = await this.feedbackService.findAllForExport(filters);
    const buffer = this.exportService.exportFeedbacks(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=feedbacks.xlsx');
    res.send(buffer);
  }

  @Get('after-sale-report')
  async exportAfterSaleReport(@Query() filters: AfterSaleFilterDto, @Res() res: Response) {
    const data = await this.afterSaleService.findAllForExport(filters);
    const buffer = this.exportService.exportAfterSaleReport(data);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=after-sale-report.xlsx');
    res.send(buffer);
  }

  @Get('budget/:id')
  async exportBudget(@Param('id') id: string, @Res() res: Response) {
    const buffer = await this.exportService.exportBudget(id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=budget.xlsx');
    res.send(buffer);
  }
}
