import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { MaterialsModule } from '../materials/materials.module';
import { UsersModule } from '../users/users.module';
import { TimelinesModule } from '../timelines/timelines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    MaterialsModule,
    UsersModule,
    TimelinesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [TypeOrmModule, OrdersService],
})
export class OrdersModule {}
