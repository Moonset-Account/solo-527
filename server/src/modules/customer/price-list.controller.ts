import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PriceListService } from './price-list.service';
import { PaginationDto } from '../../common/dto/pagination.dto';

@ApiTags('客户价目表')
@Controller('price-lists')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get()
  @ApiOperation({ summary: '获取价目表列表' })
  findAll(@Query() pagination: PaginationDto) {
    return this.priceListService.findAll(pagination);
  }

  @Get('customer/:customerId')
  @ApiOperation({ summary: '获取指定客户的价目表' })
  findByCustomerId(
    @Param('customerId') customerId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.priceListService.findByCustomerId(customerId, pagination);
  }

  @Get('customer/:customerId/active')
  @ApiOperation({ summary: '获取指定客户的启⽤价目表' })
  findActiveByCustomerId(@Param('customerId') customerId: string) {
    return this.priceListService.findActiveByCustomerId(customerId);
  }

  @Get('customer/:customerId/product/:productName')
  @ApiOperation({ summary: '按产品名称查找客户价目' })
  findByProductName(
    @Param('customerId') customerId: string,
    @Param('productName') productName: string,
  ) {
    return this.priceListService.findByProductName(customerId, productName);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取价目表详情' })
  findOne(@Param('id') id: string) {
    return this.priceListService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: '创建价目表' })
  create(@Body() dto: any, @Query('operator') operator: string = 'system') {
    return this.priceListService.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新价目表' })
  update(
    @Param('id') id: string,
    @Body() dto: any,
    @Query('operator') operator: string = 'system',
  ) {
    return this.priceListService.update(id, dto, operator);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新价目表状态' })
  @ApiQuery({ name: 'status', enum: ['active', 'inactive'], description: '状态' })
  updateStatus(
    @Param('id') id: string,
    @Query('status') status: 'active' | 'inactive',
    @Query('operator') operator: string = 'system',
  ) {
    return this.priceListService.updateStatus(id, status, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除价目表' })
  async remove(@Param('id') id: string) {
    await this.priceListService.remove(id);
    return { success: true };
  }
}
