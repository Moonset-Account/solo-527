import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  MaterialService,
  MaterialCostService,
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialQueryDto,
  CreateMaterialCostDto,
  UpdateMaterialCostDto,
  MaterialCostQueryDto,
  MaterialCostStats,
} from './material.service';
import { Material, MaterialCost, MaterialCategory } from '../../entities';

@ApiTags('耗材管理-耗材')
@Controller('materials')
export class MaterialController {
  constructor(private readonly service: MaterialService) {}

  @Get()
  @ApiOperation({ summary: '获取耗材列表（支持多条件筛选）' })
  findAll(@Query() query: MaterialQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('low-stock')
  @ApiOperation({ summary: '获取低库存耗材预警列表' })
  findLowStock(): Promise<Material[]> {
    return this.service.findLowStock();
  }

  @Get('low-stock/notify')
  @ApiOperation({ summary: '检查低库存并发送通知' })
  checkLowStockAndNotify(): Promise<Material[]> {
    return this.service.checkLowStockAndNotify();
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取耗材列表' })
  findByCategory(@Param('category') category: MaterialCategory): Promise<Material[]> {
    return this.service.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取耗材详情（关联成本记录）' })
  findOne(@Param('id') id: string): Promise<Material> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建耗材（检查编码唯一性）' })
  create(
    @Body() dto: CreateMaterialDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Material> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新耗材（检查编码唯一性）' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Material> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除耗材' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('耗材管理-耗材成本')
@Controller('material-costs')
export class MaterialCostController {
  constructor(private readonly service: MaterialCostService) {}

  @Get()
  @ApiOperation({ summary: '获取耗材成本列表（支持多条件筛选）' })
  findAll(@Query() query: MaterialCostQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取耗材成本统计' })
  getStats(
    @Query('materialId') materialId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<MaterialCostStats> {
    return this.service.getStats(
      materialId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('material/:materialId')
  @ApiOperation({ summary: '按耗材ID获取成本记录列表' })
  findByMaterialId(@Param('materialId') materialId: string): Promise<MaterialCost[]> {
    return this.service.findByMaterialId(materialId);
  }

  @Get('range')
  @ApiOperation({ summary: '获取日期范围内的耗材成本记录' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('materialId') materialId?: string,
  ): Promise<MaterialCost[]> {
    return this.service.findByDateRange(new Date(startDate), new Date(endDate), materialId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取耗材成本详情（关联查询）' })
  findOne(@Param('id') id: string): Promise<MaterialCost> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建耗材成本记录（自动扣减库存）' })
  create(
    @Body() dto: CreateMaterialCostDto,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialCost> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新耗材成本记录' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaterialCostDto,
    @Query('operator') operator: string = 'system',
  ): Promise<MaterialCost> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除耗材成本记录' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
