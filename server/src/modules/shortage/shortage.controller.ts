import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  MaterialShortageService,
  CreateMaterialShortageDto,
  UpdateMaterialShortageDto,
  ShortageQueryDto,
  ResolveShortageDto,
  ShortageStatistics,
} from './shortage.service';
import { MaterialShortage } from '../../entities';

@ApiTags('缺料管理')
@Controller('shortages')
export class MaterialShortageController {
  constructor(private readonly service: MaterialShortageService) {}

  @Get()
  @ApiOperation({ summary: '获取缺料列表（支持按状态、影响级别、订单ID筛选）' })
  findAll(@Query() query: ShortageQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '统计各状态缺料数量' })
  getStatistics(): Promise<ShortageStatistics> {
    return this.service.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取缺料详情（关联订单和物料）' })
  findOne(@Param('id') id: string): Promise<MaterialShortage> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建缺料记录（自动计算缺料数量，发送高优先级通知）' })
  create(
    @Body() dto: CreateMaterialShortageDto,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialShortage> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新缺料记录（自动重新计算缺料数量）' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialShortageDto,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialShortage> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除缺料记录' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/start-processing')
  @ApiOperation({ summary: '开始处理缺料问题（open → in_progress）' })
  startProcessing(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialShortage> {
    return this.service.startProcessing(id, operator);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: '标记缺料已解决（in_progress → resolved，需填写解决结果）' })
  resolve(
    @Param('id') id: string,
    @Body() dto: ResolveShortageDto,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialShortage> {
    return this.service.resolve(id, dto, operator);
  }

  @Post(':id/close')
  @ApiOperation({ summary: '关闭缺料记录（resolved → closed）' })
  close(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialShortage> {
    return this.service.close(id, operator);
  }
}
