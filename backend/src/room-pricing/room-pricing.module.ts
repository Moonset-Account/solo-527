import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomPricing, RoomPricingSchema } from './room-pricing.schema';
import { RoomPricingService } from './room-pricing.service';
import { RoomPricingController } from './room-pricing.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: RoomPricing.name, schema: RoomPricingSchema }])],
  controllers: [RoomPricingController],
  providers: [RoomPricingService],
})
export class RoomPricingModule {}
