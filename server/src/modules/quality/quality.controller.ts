import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QualityService } from './quality.service';
import { TransitionDto } from './dto/transition.dto';
import { HandleNoShowDto } from './dto/handle-no-show.dto';
import { QualityQueryDto } from './dto/quality-query.dto';
import { Quality } from '../../schemas/quality.schema';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('维修质量')
@ApiBearerAuth()
@Controller('api/quality')
@UseGuards(JwtAuthGuard)
export class QualityController {
  constructor(private readonly qualityService: QualityService) {}

  @Get()
  @ApiOperation({ summary: '按状态获取质量记录列表' })
  @ApiResponse({ status: 200, description: '成功获取质量记录列表' })
  async findAll(@Query() query: QualityQueryDto): Promise<PaginatedResponse<Quality>> {
    return this.qualityService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取质量记录详情' })
  @ApiResponse({ status: 200, type: Quality })
  async findOne(@Param('id') id: string): Promise<Quality> {
    return this.qualityService.findOne(id);
  }

  @Get('report')
  @ApiOperation({ summary: '获取报表数据' })
  @ApiResponse({ status: 200, description: '报表数据' })
  async getReport(): Promise<{
    transitionRecords: any[];
    noShowRecords: Quality[];
    exceptionRecords: Quality[];
  }> {
    return this.qualityService.getReport();
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取统计数据' })
  @ApiResponse({ status: 200, description: '统计数据' })
  async getStatistics(): Promise<{
    total: number;
    byStatus: any;
    noShowCount: number;
    averageProcessingTime: number;
  }> {
    return this.qualityService.getStatistics();
  }

  @Post(':id/transition')
  @ApiOperation({ summary: '状态流转' })
  @ApiResponse({ status: 200, type: Quality })
  async transition(
    @Param('id') id: string,
    @Body() transitionDto: TransitionDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Quality> {
    return this.qualityService.transition(id, transitionDto, user);
  }

  @Post(':id/handle-no-show')
  @ApiOperation({ summary: '处理爽约' })
  @ApiResponse({ status: 200, type: Quality })
  async handleNoShow(
    @Param('id') id: string,
    @Body() handleNoShowDto: HandleNoShowDto,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<Quality> {
    return this.qualityService.handleNoShow(id, handleNoShowDto, user);
  }
}
