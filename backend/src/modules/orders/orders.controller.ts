import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';
import { CreateOrderDto, ConfirmSelectionDto, RecordDownloadDto, SubmitSatisfactionDto, PaymentDto, QueryOrdersDto } from './dto/order.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';
import { OrderStatus } from '../../common/enums/order.enum';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.ordersService.create(createOrderDto, userId);
  }

  @Get()
  findAll(
    @Query() query: QueryOrdersDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.findAll(query, userId, userRole);
  }

  @Get('my')
  getMyOrders(
    @Query() query: QueryOrdersDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.ordersService.getMyOrders(userId, query);
  }

  @Get('photographer')
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  getPhotographerOrders(
    @Query() query: QueryOrdersDto,
    @GetCurrentUser('id') userId: string,
  ) {
    return this.ordersService.getPhotographerOrders(userId, query);
  }

  @Get('no/:orderNo')
  findByOrderNo(@Param('orderNo') orderNo: string) {
    return this.ordersService.findByOrderNo(orderNo);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.checkPermission(id, userId, userRole);
  }

  @Put(':id/pay')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  pay(
    @Param('id') id: string,
    @Body() paymentDto: PaymentDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.pay(id, paymentDto, userId, userRole);
  }

  @Put(':id/confirm-selection')
  confirmSelection(
    @Param('id') id: string,
    @Body() dto: ConfirmSelectionDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.confirmSelection(id, dto, userId, userRole);
  }

  @Put(':id/download')
  recordDownload(
    @Param('id') id: string,
    @Body() dto: RecordDownloadDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.recordDownload(id, dto, userId, userRole);
  }

  @Put(':id/satisfaction')
  submitSatisfaction(
    @Param('id') id: string,
    @Body() dto: SubmitSatisfactionDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.ordersService.submitSatisfaction(id, dto, userId, userRole);
  }

  @Put(':id/status')
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: OrderStatus,
    @GetCurrentUser('id') operatorId: string,
  ) {
    return this.ordersService.updateStatus(id, status, operatorId);
  }
}
