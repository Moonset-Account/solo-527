import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { ReportType, ReportFormat } from '../../entities/report.entity';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  async getReports(
    @Query('type') type?: ReportType,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('initiatorId') initiatorId?: string,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.reportsService.getReportList(
      type,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined,
      initiatorId,
      page,
      pageSize,
    );
  }

  @Post()
  async createReport(
    @Body()
    body: {
      title: string;
      type: ReportType;
      format?: ReportFormat;
      dataScope: string;
      startTime: string;
      endTime: string;
      filters?: Record<string, any>;
      notes?: string;
    },
    @Request() req,
  ) {
    return this.reportsService.generateReport(
      {
        title: body.title,
        type: body.type,
        format: body.format || ReportFormat.EXCEL,
        dataScope: body.dataScope,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        filters: body.filters,
        notes: body.notes,
      },
      req.user,
    );
  }

  @Get(':id')
  async getReport(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getReportById(id);
  }

  @Post(':id/download')
  async downloadReport(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.reportsService.incrementDownloadCount(id, req.user);
  }
}
