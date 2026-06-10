import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CashierRecordSchema } from './cashier.schema';
import { CashierService } from './cashier.service';
import { CashierController } from './cashier.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'CashierRecord', schema: CashierRecordSchema }])],
  providers: [CashierService],
  controllers: [CashierController],
  exports: [CashierService],
})
export class CashierModule {}
