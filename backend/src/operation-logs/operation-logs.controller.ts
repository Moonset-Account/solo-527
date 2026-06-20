import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { OperationLogsService } from './operation-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { SearchDto } from '../common/dto/search.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('operation-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OperationLogsController {
  constructor(private readonly operationLogsService: OperationLogsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.HR)
  findAll(@Query() searchDto: SearchDto) {
    return this.operationLogsService.findAll(searchDto);
  }

  @Get('my')
  findMyLogs(@CurrentUser() user: any, @Query('limit') limit?: number) {
    return this.operationLogsService.findByUserId(user.id, limit);
  }
}
