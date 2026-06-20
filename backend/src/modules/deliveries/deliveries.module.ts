import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveriesService } from './deliveries.service';
import { DeliveriesController } from './deliveries.controller';
import { Delivery } from './entities/delivery.entity';
import { OrdersModule } from '../orders/orders.module';
import { TimelinesModule } from '../timelines/timelines.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Delivery]),
    OrdersModule,
    TimelinesModule,
  ],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
  exports: [TypeOrmModule, DeliveriesService],
})
export class DeliveriesModule {}
