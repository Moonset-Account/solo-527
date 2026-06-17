import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RegistrationsService } from './registrations.service';

@ApiTags('报名管理')
@Controller('registrations')
export class RegistrationsController {
  constructor(private service: RegistrationsService) {}

  @Post()
  @ApiOperation({ summary: '创建报名(公开)' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Get('lookup')
  @ApiOperation({ summary: '按手机号+订单号查询状态(公开)' })
  lookup(@Query('phone') phone: string, @Query('orderId') orderId?: string) {
    return this.service.lookup(phone, orderId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '报名列表(管理员)' })
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '报名详情' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核操作: approve/reject/close' })
  review(@Param('id') id: string, @Body() body: { action: string; reason?: string; note?: string; closeReasonId?: string; customReason?: string }, @Req() req: any) {
    return this.service.review(id, body.action, body, req.user.sub);
  }
}
