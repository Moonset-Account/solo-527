import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';
import { ExportService } from './export.service.js';
import { FeedbackService } from '../feedback/feedback.service.js';
import { AfterSaleService } from '../after-sale/after-sale.service.js';
import { FeedbackFilterDto } from '../feedback/dto.js';
import { AfterSaleFilterDto } from '../after-sale/dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ExportLogFilterDto, ExportDto } from './dto.js';
import { ExportType, ExportFormat } from './export-log.entity.js';

@Controller('export')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ExportController {
  constructor(
    private exportService: ExportService,
    private feedbackService: FeedbackService,
    private afterSaleService: AfterSaleService,
  ) {}

  @Get('feedbacks')
  async exportFeedbacks(
    @Query() filters: FeedbackFilterDto,
    @Query() exportDto: ExportDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = (req.user as any).id;
    const format = exportDto.format || 'xlsx';
    const data = await this.feedbackService.findAllForExport(filters, (req.user as any).companyId);

    let content: Buffer | string;
    let contentType: string;
    let fileName: string;
    let fileSize: number;

    if (format === 'csv') {
      content = this.exportService.exportFeedbacksCsv(data);
      contentType = 'text/csv; charset=utf-8';
      fileName = `feedbacks-${Date.now()}.csv`;
      fileSize = Buffer.byteLength(content, 'utf8');
    } else {
      content = this.exportService.exportFeedbacks(data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `feedbacks-${Date.now()}.xlsx`;
      fileSize = content.length;
    }

    await this.exportService.logExport(
      'feedbacks' as ExportType,
      format as ExportFormat,
      fileName,
      data.length,
      fileSize,
      userId,
      filters,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(content);
  }

  @Get('after-sale-report')
  async exportAfterSaleReport(
    @Query() filters: AfterSaleFilterDto,
    @Query() exportDto: ExportDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = (req.user as any).id;
    const format = exportDto.format || 'xlsx';
    const data = await this.afterSaleService.findAllForExport(filters, (req.user as any).companyId);

    let content: Buffer | string;
    let contentType: string;
    let fileName: string;
    let fileSize: number;

    if (format === 'csv') {
      content = this.exportService.exportAfterSaleReportCsv(data);
      contentType = 'text/csv; charset=utf-8';
      fileName = `after-sale-report-${Date.now()}.csv`;
      fileSize = Buffer.byteLength(content, 'utf8');
    } else {
      content = this.exportService.exportAfterSaleReport(data);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      fileName = `after-sale-report-${Date.now()}.xlsx`;
      fileSize = content.length;
    }

    await this.exportService.logExport(
      'after_sale' as ExportType,
      format as ExportFormat,
      fileName,
      data.length,
      fileSize,
      userId,
      filters,
    );

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(content);
  }

  @Get('budget/:id')
  async exportBudget(
    @Param('id') id: string,
    @Query() exportDto: ExportDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = (req.user as any).id;
    const format = exportDto.format || 'xlsx';
    const content = await this.exportService.exportBudget(id);
    const fileName = `budget-${id}-${Date.now()}.xlsx`;
    const fileSize = content.length;

    await this.exportService.logExport(
      'budget' as ExportType,
      format as ExportFormat,
      fileName,
      1,
      fileSize,
      userId,
      { budgetId: id },
    );

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(content);
  }

  @Get('logs')
  async getExportLogs(@Query() filters: ExportLogFilterDto) {
    return this.exportService.getExportLogs(filters);
  }
}
