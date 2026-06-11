import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';
import { Worker, WorkerSchema } from '../../schemas/worker.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { Address, AddressSchema } from '../../schemas/address.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Worker.name, schema: WorkerSchema },
      { name: User.name, schema: UserSchema },
      { name: Address.name, schema: AddressSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
