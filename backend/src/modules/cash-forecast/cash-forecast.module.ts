import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashForecast, Bill } from '@/database/entities';
import { CashForecastService } from './cash-forecast.service';
import { CashForecastController } from './cash-forecast.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CashForecast, Bill])],
  controllers: [CashForecastController],
  providers: [CashForecastService],
  exports: [CashForecastService],
})
export class CashForecastModule {}
