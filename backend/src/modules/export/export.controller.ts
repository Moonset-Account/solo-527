import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { ExportQueueService } from '../../queues/export.queue.service';

@ApiTags('导出管理')
@Controller('exports')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(private readonly exportQueueService: ExportQueueService) {}

  @Post('profit-report')
  @ApiOperation({ summary: '导出利润报表' })
  async exportProfitReport(@Body() filters: any, @CurrentUser() user: User) {
    const job = await this.exportQueueService.addExportJob({
      type: 'profit_report',
      userId: user.id,
      filters,
      format: 'csv',
    });
    return { jobId: job.id, message: '导出任务已加入队列' };
  }

  @Post('demand-list')
  @ApiOperation({ summary: '导出需求列表' })
  async exportDemandList(@Body() filters: any, @CurrentUser() user: User) {
    const job = await this.exportQueueService.addExportJob({
      type: 'demand_list',
      userId: user.id,
      filters,
      format: 'csv',
    });
    return { jobId: job.id, message: '导出任务已加入队列' };
  }

  @Post('quote-list')
  @ApiOperation({ summary: '导出报价列表' })
  async exportQuoteList(@Body() filters: any, @CurrentUser() user: User) {
    const job = await this.exportQueueService.addExportJob({
      type: 'quote_list',
      userId: user.id,
      filters,
      format: 'csv',
    });
    return { jobId: job.id, message: '导出任务已加入队列' };
  }

  @Post('contract-list')
  @ApiOperation({ summary: '导出合同列表' })
  async exportContractList(@Body() filters: any, @CurrentUser() user: User) {
    const job = await this.exportQueueService.addExportJob({
      type: 'contract_list',
      userId: user.id,
      filters,
      format: 'csv',
    });
    return { jobId: job.id, message: '导出任务已加入队列' };
  }

  @Get(':id/status')
  @ApiOperation({ summary: '查询导出任务状态' })
  async getExportStatus(@Param('id') id: string) {
    const status = await this.exportQueueService.getJobStatus(id);
    return status;
  }
}
