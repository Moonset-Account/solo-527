import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentRecord } from '../../entities/payment-record.entity.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([PaymentRecord])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
