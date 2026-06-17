import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AccessExceptionsService } from './access-exceptions.service';
import { CreateAccessExceptionDto, UpdateAccessExceptionDto } from './dto/access-exception.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@ApiTags('通行异常记录')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('access-exceptions')
export class AccessExceptionsController {
  constructor(private readonly service: AccessExceptionsService) {}

  @Post()
  @ApiOperation({ summary: '创建异常记录' })
  create(@Body() dto: CreateAccessExceptionDto, @CurrentUser() u: User) { return this.service.create(dto, u._id); }

  @Get()
  @ApiOperation({ summary: '异常记录列表(含影响范围/责任人)' })
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get('statistics')
  @ApiOperation({ summary: '异常统计' })
  statistics() { return this.service.statistics(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: '更新异常记录(含处理说明日志,记录操作人)' })
  update(@Param('id') id: string, @Body() dto: UpdateAccessExceptionDto, @CurrentUser() u: User) {
    return this.service.update(id, dto, u._id);
  }

  @Put(':id/config-status')
  @ApiOperation({ summary: '切换配置状态:启用/停用/草稿' })
  updateConfigStatus(@Param('id') id: string, @Body('configStatus') s: ConfigStatus, @CurrentUser() u: User) {
    return this.service.updateConfigStatus(id, s, u._id);
  }
}
