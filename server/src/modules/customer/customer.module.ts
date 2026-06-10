import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer, PriceList } from '../../entities';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';
import { PriceListService } from './price-list.service';
import { PriceListController } from './price-list.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, PriceList])],
  providers: [CustomerService, PriceListService],
  controllers: [CustomerController, PriceListController],
  exports: [CustomerService, PriceListService],
})
export class CustomerModule {}
