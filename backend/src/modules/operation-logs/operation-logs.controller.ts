import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { OperationLog } from './operation-log.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('operatorId') operatorId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ): Promise<{ data: OperationLog[]; total: number }> {
    return this.operationLogsService.findAll(
      startDate,
      endDate,
      operatorId,
      action,
      targetType,
      parseInt(page),
      parseInt(limit),
    );
  }
}
