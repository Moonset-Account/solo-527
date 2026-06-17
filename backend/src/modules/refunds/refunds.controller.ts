import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RefundsService } from './refunds.service';

@ApiTags('退款管理')
@Controller('refunds')
export class RefundsController {
  constructor(private service: RefundsService) {}

  @Post()
  @ApiOperation({ summary: '提交退款申请 (公开)' })
  apply(@Body() body: { orderId: string; reason: string; note?: string; phone: string }) {
    return this.service.apply(body);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '退款申请列表' })
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '退款详情(含原单)' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Patch(':id/review')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '审核退款' })
  review(@Param('id') id: string, @Body() body: { action: string; note?: string }, @Req() req: any) {
    return this.service.review(id, body.action, body.note || '', req.user.sub);
  }

  @Post(':id/execute')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '执行退款(模拟)' })
  execute(@Param('id') id: string, @Req() req: any) {
    return this.service.execute(id, req.user.sub);
  }
}
