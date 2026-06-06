import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Demand } from '../../entities/demand.entity';
import { Quote } from '../../entities/quote.entity';
import { Contract } from '../../entities/contract.entity';
import { Supplier } from '../../entities/supplier.entity';
import { User } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Demand, Quote, Contract, Supplier, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
