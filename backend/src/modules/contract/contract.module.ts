import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractController } from './contract.controller';
import { ContractService } from './contract.service';
import { Contract } from '../../entities/contract.entity';
import { ContractAttachment } from '../../entities/contract-attachment.entity';
import { ContractNumberPool } from '../../entities/contract-number-pool.entity';
import { ApprovalFlow } from '../../entities/approval-flow.entity';
import { FileResource } from '../../entities/file-resource.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { User } from '../../entities/user.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contract, ContractAttachment, ContractNumberPool,
      ApprovalFlow, FileResource, AuditLog, User,
    ]),
    NotificationModule,
  ],
  controllers: [ContractController],
  providers: [ContractService],
  exports: [ContractService],
})
export class ContractModule {}
