import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  QualityInspectionService,
  CreateQualityInspectionDto,
  UpdateQualityInspectionDto,
  QualityQueryDto,
  QualityStatisticsDto,
  QualityStatisticsResult,
} from './quality.service';
import { QualityInspection } from '../../entities';

@ApiTags('质量管理-质检记录')
@Controller('quality/inspections')
export class QualityInspectionController {
  constructor(private readonly service: QualityInspectionService) {}

  @Get()
  @ApiOperation({ summary: '获取质检记录列表（支持多条件筛选）' })
  findAll(@Query() query: QualityQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: '获取订单的质检记录' })
  findByOrderId(@Param('orderId') orderId: string): Promise<QualityInspection[]> {
    return this.service.findByOrderId(orderId);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取质检统计数据' })
  getStatistics(@Query() query: QualityStatisticsDto): Promise<QualityStatisticsResult> {
    return this.service.getStatistics(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取质检记录详情（关联查询）' })
  findOne(@Param('id') id: string): Promise<QualityInspection> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建质检记录' })
  create(
    @Body() dto: CreateQualityInspectionDto,
    @Query('operator') operator: string = 'system',
  ): Promise<QualityInspection> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新质检记录' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQualityInspectionDto,
    @Query('operator') operator: string = 'system',
  ): Promise<QualityInspection> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除质检记录' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
