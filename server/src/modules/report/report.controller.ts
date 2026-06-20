import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateReportDto, UpdateReportDto, QueryReportDto } from './report.dto';

@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(@Body() dto: CreateReportDto) {
    return this.reportService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryReportDto) {
    return this.reportService.findAll(query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportService.update(id, dto);
  }
}
