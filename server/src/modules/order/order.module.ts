import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order, ProductionProgress } from '../../entities';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, ProductionProgress]),
    SystemConfigModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
