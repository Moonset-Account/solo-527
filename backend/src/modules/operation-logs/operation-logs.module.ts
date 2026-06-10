import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationLogSchema } from './operation-log.schema';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'OperationLog', schema: OperationLogSchema }])],
  providers: [OperationLogsService],
  controllers: [OperationLogsController],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
