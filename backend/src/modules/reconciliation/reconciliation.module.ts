import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reconciliation, Bill, CashForecast, CollectionRecord, Invoice } from '@/database/entities';
import { ReconciliationService } from './reconciliation.service';
import { ReconciliationController } from './reconciliation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Reconciliation, Bill, CashForecast, CollectionRecord, Invoice])],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
  exports: [ReconciliationService],
})
export class ReconciliationModule {}
