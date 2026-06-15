import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fault } from './entities/fault.entity';
import { FaultsService } from './faults.service';
import { FaultsController } from './faults.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Fault]), AuditLogsModule],
  controllers: [FaultsController],
  providers: [FaultsService],
  exports: [FaultsService],
})
export class FaultsModule {}
