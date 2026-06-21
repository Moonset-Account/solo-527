import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { User } from '../../entities/user.entity';
import { Role } from '../../entities/role.entity';
import { UserRole } from '../../entities/user-role.entity';
import { Contract } from '../../entities/contract.entity';
import { ContractAttachment } from '../../entities/contract-attachment.entity';
import { ApprovalFlow } from '../../entities/approval-flow.entity';
import { ConflictRecord } from '../../entities/conflict-record.entity';
import { Notification } from '../../entities/notification.entity';
import { CallbackLog } from '../../entities/callback-log.entity';
import { ContractNumberPool } from '../../entities/contract-number-pool.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Role, UserRole, Contract, ContractAttachment,
      ApprovalFlow, ConflictRecord, Notification, CallbackLog, ContractNumberPool,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
