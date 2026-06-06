import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemandService } from './demand.service';
import { DemandController } from './demand.controller';
import { Demand } from '../../entities/demand.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Demand])],
  controllers: [DemandController],
  providers: [DemandService],
  exports: [DemandService],
})
export class DemandModule {}
