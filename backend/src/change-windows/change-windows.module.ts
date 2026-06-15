import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeWindow } from './entities/change-window.entity';
import { ChangeWindowsService } from './change-windows.service';
import { ChangeWindowsController } from './change-windows.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChangeWindow]), AuditLogsModule],
  controllers: [ChangeWindowsController],
  providers: [ChangeWindowsService],
  exports: [ChangeWindowsService],
})
export class ChangeWindowsModule {}
