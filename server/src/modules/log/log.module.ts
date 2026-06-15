import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LogService } from './log.service.js';
import { LogController } from './log.controller.js';
import { LogSchema } from '../../schemas/log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Log', schema: LogSchema },
    ]),
  ],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
