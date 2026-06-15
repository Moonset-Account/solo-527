import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill, StatusHistory, Customer } from '@/database/entities';
import { BillService } from './bill.service';
import { BillController } from './bill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, StatusHistory, Customer])],
  controllers: [BillController],
  providers: [BillService],
  exports: [BillService],
})
export class BillModule {}
