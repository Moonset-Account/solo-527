import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargeItem } from './entities/charge-item.entity';
import { Charge } from './entities/charge.entity';
import { ChargeAccuracy } from './entities/charge-accuracy.entity';
import { ChargeService } from './services/charge.service';
import { ChargeController } from './controllers/charge.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ChargeItem, Charge, ChargeAccuracy])],
  controllers: [ChargeController],
  providers: [ChargeService],
  exports: [ChargeService],
})
export class ChargeModule {}
