import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settlement } from '../../entities/settlement.entity.js';
import { SettlementRule } from '../../entities/settlement-rule.entity.js';
import { SettlementsController } from './settlements.controller.js';
import { SettlementsService } from './settlements.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Settlement, SettlementRule])],
  controllers: [SettlementsController],
  providers: [SettlementsService],
  exports: [SettlementsService],
})
export class SettlementsModule {}
