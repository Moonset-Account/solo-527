import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SystemConfigService } from './system-config.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ConfigCategory } from '../../entities';

@ApiTags('系统配置')
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: '获取系统配置列表' })
  findAll(@Query() pagination: PaginationDto) {
    return this.service.findAll(pagination);
  }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取配置' })
  findByCategory(@Param('category') category: ConfigCategory) {
    return this.service.findByCategory(category);
  }

  @Get('keys')
  @ApiOperation({ summary: '批量获取配置' })
  findByKeys(@Query('keys') keys: string) {
    const keyArray = keys.split(',');
    return this.service.findByKeys(keyArray);
  }

  @Get('value/:key')
  @ApiOperation({ summary: '获取单个配置值' })
  getValue(@Param('key') key: string) {
    return { key, value: this.service.getConfigValue(key) };
  }

  @Get('json/:key')
  @ApiOperation({ summary: '获取JSON格式配置' })
  getJson(@Param('key') key: string) {
    return { key, value: this.service.getConfigJson(key) };
  }

  @Post()
  @ApiOperation({ summary: '创建系统配置' })
  create(@Body() dto: any, @Query('operator') operator: string = 'system') {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新系统配置' })
  async update(
    @Param('id') id: string,
    @Body() dto: any,
    @Query('operator') operator: string = 'system',
  ) {
    const result = await this.service.update(id, dto, operator);
    await this.service.refreshCache();
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除系统配置' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    await this.service.refreshCache();
    return { success: true };
  }

  @Post('refresh-cache')
  @ApiOperation({ summary: '刷新配置缓存' })
  async refreshCache() {
    await this.service.refreshCache();
    return { success: true };
  }
}
