import { Module } from '@nestjs/common';
import { LogService } from './log.service.js';
import { LogController } from './log.controller.js';

@Module({
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
