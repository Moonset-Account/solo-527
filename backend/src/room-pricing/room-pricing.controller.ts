import { Controller, Get, Post, Body, Put, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RoomPricingService } from './room-pricing.service';
import { CreateRoomPricingDto, UpdateRoomPricingDto } from './dto/room-pricing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/user.schema';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@ApiTags('房态价格配置')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('room-pricing')
export class RoomPricingController {
  constructor(private readonly service: RoomPricingService) {}

  @Post()
  @ApiOperation({ summary: '创建房态价格配置' })
  create(@Body() dto: CreateRoomPricingDto, @CurrentUser() u: User) { return this.service.create(dto, u._id); }

  @Get()
  @ApiOperation({ summary: '房态价格列表' })
  findAll(@Query() q: any) { return this.service.findAll(q); }

  @Get('statistics')
  @ApiOperation({ summary: '房态统计' })
  statistics() { return this.service.statistics(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Put(':id')
  @ApiOperation({ summary: '更新房态价格(记录操作人)' })
  update(@Param('id') id: string, @Body() dto: UpdateRoomPricingDto, @CurrentUser() u: User) {
    return this.service.update(id, dto, u._id);
  }

  @Put(':id/config-status')
  @ApiOperation({ summary: '切换配置状态:启用/停用/草稿' })
  updateConfigStatus(@Param('id') id: string, @Body('configStatus') s: ConfigStatus, @CurrentUser() u: User) {
    return this.service.updateConfigStatus(id, s, u._id);
  }
}
