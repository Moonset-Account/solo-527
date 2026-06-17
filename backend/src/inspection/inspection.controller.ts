import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InspectionService } from './inspection.service';
import { CreateInspectionDto, UpdateInspectionDto } from './dto/inspection.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@ApiTags('巡检任务')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inspection')
export class InspectionController {
  constructor(private readonly service: InspectionService) {}

  @Post()
  @ApiOperation({ summary: '创建巡检任务' })
  create(@Body() dto: CreateInspectionDto, @CurrentUser() u: User) { return this.service.create(dto, u._id); }

  @Get()
  @ApiOperation({ summary: '巡检任务列表' })
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: '更新巡检任务(记录操作人)' })
  update(@Param('id') id: string, @Body() dto: UpdateInspectionDto, @CurrentUser() u: User) {
    return this.service.update(id, dto, u._id);
  }

  @Put(':id/config-status')
  @ApiOperation({ summary: '切换配置状态:启用/停用/草稿' })
  updateConfigStatus(@Param('id') id: string, @Body('configStatus') s: ConfigStatus, @CurrentUser() u: User) {
    return this.service.updateConfigStatus(id, s, u._id);
  }
}
