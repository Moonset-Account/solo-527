import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AfterSales } from './after-sales.entity';
import { AfterSalesService } from './after-sales.service';
import { AfterSalesController } from './after-sales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AfterSales])],
  controllers: [AfterSalesController],
  providers: [AfterSalesService],
  exports: [AfterSalesService, TypeOrmModule],
})
export class AfterSalesModule {}
