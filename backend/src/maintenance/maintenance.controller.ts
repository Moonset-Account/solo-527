import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dto/maintenance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@ApiTags('工程报修')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('maintenance')
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  @ApiOperation({ summary: '创建报修单' })
  create(@Body() dto: CreateMaintenanceDto, @CurrentUser() u: User) { return this.service.create(dto, u._id); }

  @Get()
  @ApiOperation({ summary: '报修单列表' })
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: '更新报修单(含处理日志,记录操作人)' })
  update(@Param('id') id: string, @Body() dto: UpdateMaintenanceDto, @CurrentUser() u: User) {
    return this.service.update(id, dto, u._id);
  }

  @Put(':id/config-status')
  @ApiOperation({ summary: '切换配置状态:启用/停用/草稿' })
  updateConfigStatus(@Param('id') id: string, @Body('configStatus') s: ConfigStatus, @CurrentUser() u: User) {
    return this.service.updateConfigStatus(id, s, u._id);
  }
}
