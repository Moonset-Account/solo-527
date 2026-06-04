import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerRequirement } from '../../entities/customer-requirement.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { CustomerRequirementService } from './customer-requirement.service';
import { CustomerRequirementController } from './customer-requirement.controller';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerRequirement, AuditLog]),
    NotificationModule,
  ],
  providers: [CustomerRequirementService],
  controllers: [CustomerRequirementController],
  exports: [CustomerRequirementService],
})
export class CustomerRequirementModule {}
