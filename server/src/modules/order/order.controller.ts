import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrderService, CreateOrderDto, UpdateOrderDto, OrderQueryDto } from './order.service';
import { Order } from '../../entities';

@ApiTags('订单管理')
@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get()
  @ApiOperation({ summary: '获取订单列表（支持多条件筛选）' })
  findAll(@Query() query: OrderQueryDto) {
    return this.service.findAllWithFilters(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情（关联查询）' })
  findOne(@Param('id') id: string): Promise<Order> {
    return this.service.findOneWithRelations(id);
  }

  @Post()
  @ApiOperation({ summary: '创建订单（级联保存工艺和交付要求）' })
  create(
    @Body() dto: CreateOrderDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.create(dto, operator);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新订单' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.update(id, dto, operator);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除订单' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认订单' })
  confirmOrder(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.confirmOrder(id, operator);
  }

  @Post(':id/start-production')
  @ApiOperation({ summary: '开始生产' })
  startProduction(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.startProduction(id, operator);
  }

  @Post(':id/complete-production')
  @ApiOperation({ summary: '完成生产' })
  completeProduction(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.completeProduction(id, operator);
  }

  @Post(':id/quality-check')
  @ApiOperation({ summary: '质检通过' })
  qualityCheck(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.qualityCheck(id, operator);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '完成订单' })
  completeOrder(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.completeOrder(id, operator);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消订单' })
  cancelOrder(
    @Param('id') id: string,
    @Query('operator') operator: string = 'system',
  ): Promise<Order> {
    return this.service.cancelOrder(id, operator);
  }
}
