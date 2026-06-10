import { Controller, Get, Post, Body, Param, Query, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import * as dayjs from 'dayjs';
import { ExportRecordService, OrderExportService, ExportRecordQueryDto, OrderExportDto } from './export.service';
import { ExportRecord } from '../../entities';

@ApiTags('导出管理')
@Controller('exports')
export class ExportController {
  constructor(
    private readonly exportRecordService: ExportRecordService,
    private readonly orderExportService: OrderExportService,
  ) {}

  @Get('records')
  @ApiOperation({ summary: '获取导出记录列表（支持按类型和时间范围筛选）' })
  getRecords(@Query() query: ExportRecordQueryDto) {
    return this.exportRecordService.findByType(query);
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取单条导出记录详情' })
  getRecord(@Param('id') id: string): Promise<ExportRecord> {
    return this.exportRecordService.findById(id);
  }

  @Post('orders')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '订单导出（返回 xlsx 文件流）' })
  async exportOrders(
    @Body() dto: OrderExportDto,
    @Res() res: Response,
  ) {
    const buffer = await this.orderExportService.exportOrders(dto);
    const fileName = `订单导出_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': buffer.length,
    });

    res.send(buffer);
  }
}
