import { Controller, Get, Post, Param, Body, Query, UseGuards, Res, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { CheckinService } from './checkin.service';

@ApiTags('签到码管理')
@Controller('checkin-codes')
export class CheckinController {
  constructor(private service: CheckinService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量生成签到码' })
  generate(@Body() body: { registrationIds: string[] }) {
    return this.service.generate(body.registrationIds || []);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '签到码列表' })
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '导出签到码 CSV' })
  async export(@Query('sessionId') sessionId: string, @Res() res: Response) {
    const csv = await this.service.exportCsv(sessionId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="checkin_codes_${Date.now()}.csv"`);
    res.send(csv);
  }

  @Get(':code')
  @ApiOperation({ summary: '签到码详情 (公开/管理员)' })
  get(@Param('code') code: string) {
    return this.service.getByCode(code);
  }

  @Post(':code/verify')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '核销签到' })
  verify(@Param('code') code: string, @Body() body: { location?: string }, @Req() req: any) {
    return this.service.verify(code, body.location || '主会场', req.user.sub);
  }
}
