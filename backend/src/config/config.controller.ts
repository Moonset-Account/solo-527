import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigItemsService } from './config.service';
import { CreateConfigItemDto, UpdateConfigItemDto } from './dto/config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/decorators/roles.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@ApiTags('系统配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('config')
export class ConfigItemsController {
  constructor(private readonly service: ConfigItemsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '创建配置项' })
  create(@Body() dto: CreateConfigItemDto, @CurrentUser() u: User) { return this.service.create(dto, u._id); }

  @Get()
  @ApiOperation({ summary: '配置项列表(支持按状态筛选:启用/停用/草稿)' })
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get('category/:category')
  @ApiOperation({ summary: '按分类获取配置' })
  findByCategory(@Param('category') c: string, @Query('status') s?: string) {
    return this.service.findByCategory(c, s);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '更新配置项(含变更日志,记录操作人)' })
  update(@Param('id') id: string, @Body() dto: UpdateConfigItemDto, @CurrentUser() u: User) {
    return this.service.update(id, dto, u._id);
  }

  @Put(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: '切换状态:启用/停用/草稿(灰度调整)' })
  updateStatus(@Param('id') id: string, @Body('status') s: ConfigStatus, @CurrentUser() u: User) {
    return this.service.updateStatus(id, s, u._id);
  }
}
