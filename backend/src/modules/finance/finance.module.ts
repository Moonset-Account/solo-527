import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceService } from './finance.service';
import { FinanceController } from './finance.controller';
import { Quote } from '../../entities/quote.entity';
import { PaymentNode } from '../../entities/payment-node.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, PaymentNode])],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
