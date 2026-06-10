import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BenefitService } from './benefit.service';
import { BenefitController } from './benefit.controller';
import { Benefit, BenefitSchema } from './benefit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Benefit.name, schema: BenefitSchema }]),
  ],
  controllers: [BenefitController],
  providers: [BenefitService],
  exports: [BenefitService],
})
export class BenefitModule {}
