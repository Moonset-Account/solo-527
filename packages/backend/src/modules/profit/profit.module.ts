import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfitStat } from '../../entities/profit-stat.entity';
import { Quote } from '../../entities/quote.entity';
import { ProfitService } from './profit.service';
import { ProfitController } from './profit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ProfitStat, Quote])],
  providers: [ProfitService],
  controllers: [ProfitController],
  exports: [ProfitService],
})
export class ProfitModule {}
