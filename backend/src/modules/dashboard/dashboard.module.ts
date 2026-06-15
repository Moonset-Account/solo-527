import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill, CollectionRecord, Reconciliation, CashForecast } from '@/database/entities';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, CollectionRecord, Reconciliation, CashForecast])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
