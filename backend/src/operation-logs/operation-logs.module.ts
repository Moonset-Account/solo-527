import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';
import { OperationLog, OperationLogSchema } from './schemas/operation-log.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: OperationLog.name, schema: OperationLogSchema }]),
    forwardRef(() => AuthModule),
  ],
  controllers: [OperationLogsController],
  providers: [OperationLogsService],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
