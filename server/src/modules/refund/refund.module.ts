import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { Refund, RefundSchema } from '../../schemas/refund.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Refund.name, schema: RefundSchema }])],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService],
})
export class RefundModule {}
