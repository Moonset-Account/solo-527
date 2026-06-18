import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from './operation-log.entity';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  providers: [OperationLogsService],
  controllers: [OperationLogsController],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
