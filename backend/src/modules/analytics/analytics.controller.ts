import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@ApiTags('统计分析')
@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private service: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '仪表板 KPI' })
  dashboard() {
    return this.service.dashboard();
  }

  @Get('quality')
  @ApiOperation({ summary: '报名质量多维统计' })
  quality(@Query() query: any) {
    return this.service.quality(query);
  }

  @Get('funnel')
  @ApiOperation({ summary: '转化漏斗' })
  funnel() {
    return this.service.funnel();
  }
}
