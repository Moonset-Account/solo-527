import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contract } from '../../entities/contract.entity';
import { Quote } from '../../entities/quote.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { ContractService } from './contract.service';
import { ContractController } from './contract.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contract, Quote, AuditLog]),
    NotificationModule,
  ],
  providers: [ContractService],
  controllers: [ContractController],
  exports: [ContractService],
})
export class ContractModule {}
