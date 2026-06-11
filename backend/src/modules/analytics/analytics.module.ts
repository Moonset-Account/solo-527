import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Order, OrderSchema } from '../../schemas/order.schema';
import { Service, ServiceSchema } from '../../schemas/service.schema';
import { Worker, WorkerSchema } from '../../schemas/worker.schema';
import { Review, ReviewSchema } from '../../schemas/review.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Service.name, schema: ServiceSchema },
      { name: Worker.name, schema: WorkerSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
