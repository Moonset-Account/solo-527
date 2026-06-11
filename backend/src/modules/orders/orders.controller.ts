import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  QueryOrdersDto,
  DispatchOrderDto,
  RescheduleOrderDto,
  CancelOrderDto,
  UpdateFulfillmentDto,
  BatchQueryDto,
  MarkSupplyDemandReasonDto,
} from './dto/orders.dto';
import { Types } from 'mongoose';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async createOrder(@Body() dto: CreateOrderDto) {
    try {
      const order = await this.ordersService.createOrder(dto);
      return {
        code: 0,
        message: '创建订单成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '创建订单失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get()
  async queryOrders(@Query() query: QueryOrdersDto) {
    try {
      const result = await this.ordersService.queryOrders(query);
      return {
        code: 0,
        message: '查询订单列表成功',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询订单列表失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':id')
  async getOrderDetail(@Param('id') id: string) {
    try {
      const orderId = new Types.ObjectId(id);
      const order = await this.ordersService.getOrderDetail(orderId);
      return {
        code: 0,
        message: '查询订单详情成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '查询订单详情失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('dispatch')
  async dispatchOrder(@Body() dto: DispatchOrderDto) {
    try {
      const order = await this.ordersService.dispatchOrder(dto);
      return {
        code: 0,
        message: '派单成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '派单失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reschedule')
  async rescheduleOrder(@Body() dto: RescheduleOrderDto) {
    try {
      const order = await this.ordersService.rescheduleOrder(dto);
      return {
        code: 0,
        message: '改约成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '改约失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('cancel')
  async cancelOrder(@Body() dto: CancelOrderDto) {
    try {
      const order = await this.ordersService.cancelOrder(dto);
      return {
        code: 0,
        message: '取消订单成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '取消订单失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('arrive')
  async arrive(@Body() dto: UpdateFulfillmentDto) {
    try {
      const order = await this.ordersService.markArrived(dto);
      return {
        code: 0,
        message: '标记到场成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '标记到场失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('start')
  async start(@Body() dto: UpdateFulfillmentDto) {
    try {
      const order = await this.ordersService.markStarted(dto);
      return {
        code: 0,
        message: '标记开始成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '标记开始失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('complete')
  async complete(@Body() dto: UpdateFulfillmentDto) {
    try {
      const order = await this.ordersService.markCompleted(dto);
      return {
        code: 0,
        message: '标记完成成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '标记完成失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('batch-query')
  async batchQuery(@Body() dto: BatchQueryDto) {
    try {
      const orders = await this.ordersService.batchQuery(dto);
      return {
        code: 0,
        message: '批量查询成功',
        data: orders,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '批量查询失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('supply-demand-reason')
  async markSupplyDemandReason(@Body() dto: MarkSupplyDemandReasonDto) {
    try {
      const order = await this.ordersService.markSupplyDemandReason(dto);
      return {
        code: 0,
        message: '标记供需原因成功',
        data: order,
      };
    } catch (error) {
      throw new HttpException(
        error.message || '标记供需原因失败',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
