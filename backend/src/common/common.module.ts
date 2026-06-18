import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationLog } from '../modules/operation-logs/operation-log.entity';
import { OperationLogService } from './services/operation-log.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OperationLog])],
  providers: [OperationLogService, JwtAuthGuard],
  exports: [OperationLogService, JwtAuthGuard],
})
export class CommonModule {}
