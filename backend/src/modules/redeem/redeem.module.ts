import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RedeemService } from './redeem.service';
import { RedeemController } from './redeem.controller';
import { RedeemRecord, RedeemRecordSchema } from './redeem.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RedeemRecord.name, schema: RedeemRecordSchema }]),
  ],
  controllers: [RedeemController],
  providers: [RedeemService],
  exports: [RedeemService],
})
export class RedeemModule {}
