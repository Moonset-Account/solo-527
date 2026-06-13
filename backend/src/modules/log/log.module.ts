import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { OperationLog } from './entities/operation-log.entity';
import { ApiRequestLog } from './entities/api-request-log.entity';
import { ApiRetryLog } from './entities/api-retry-log.entity';
import { OperationLogService } from './services/operation-log.service';
import { ApiLogService } from './services/api-log.service';
import { ApiRetryService } from './services/api-retry.service';
import { LogController } from './controllers/log.controller';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([OperationLog, ApiRequestLog, ApiRetryLog]),
    HttpModule,
  ],
  controllers: [LogController],
  providers: [OperationLogService, ApiLogService, ApiRetryService],
  exports: [OperationLogService, ApiLogService, ApiRetryService],
})
export class LogModule {}
