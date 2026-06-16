import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity.js';
import { Room } from '../../entities/room.entity.js';
import { ContractsController } from './contracts.controller.js';
import { ContractsService } from './contracts.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, Room])],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
