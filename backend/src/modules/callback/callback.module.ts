import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CallbackController } from './callback.controller';
import { CallbackService } from './callback.service';
import { CallbackLog } from '../../entities/callback-log.entity';
import { AuditLog } from '../../entities/audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CallbackLog, AuditLog]),
    ScheduleModule.forRoot(),
  ],
  controllers: [CallbackController],
  providers: [CallbackService],
  exports: [CallbackService],
})
export class CallbackModule {}
