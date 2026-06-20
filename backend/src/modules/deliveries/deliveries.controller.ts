import { Controller, Get, Post, Body, Param, Put, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto, ReviewDeliveryDto, QueryDeliveriesDto } from './dto/delivery.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user.enum';
import { GetCurrentUser } from '../../common/decorators/get-current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Roles(UserRole.PHOTOGRAPHER, UserRole.ADMIN)
  create(
    @Body() createDeliveryDto: CreateDeliveryDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('name') userName: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.deliveriesService.create(createDeliveryDto, userId, userName, userRole);
  }

  @Get()
  findAll(
    @Query() query: QueryDeliveriesDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.deliveriesService.findAll(query, userId, userRole);
  }

  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: string) {
    return this.deliveriesService.findByOrderId(orderId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findOne(id);
  }

  @Put(':id/review')
  @Roles(UserRole.CLIENT, UserRole.ADMIN)
  review(
    @Param('id') id: string,
    @Body() dto: ReviewDeliveryDto,
    @GetCurrentUser('id') userId: string,
    @GetCurrentUser('name') userName: string,
    @GetCurrentUser('role') userRole: string,
  ) {
    return this.deliveriesService.review(id, dto, userId, userName, userRole);
  }
}
