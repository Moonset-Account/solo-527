import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConflictController } from './conflict.controller';
import { ConflictService } from './conflict.service';
import { ConflictRecord } from '../../entities/conflict-record.entity';
import { AuditLog } from '../../entities/audit-log.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConflictRecord, AuditLog]),
    NotificationModule,
  ],
  controllers: [ConflictController],
  providers: [ConflictService],
  exports: [ConflictService],
})
export class ConflictModule {}
