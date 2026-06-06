import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { Contract } from '../../entities/contract.entity';
import { ApprovalLog } from '../../entities/approval-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contract, ApprovalLog])],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
