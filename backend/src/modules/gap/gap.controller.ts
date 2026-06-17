import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GapService } from './gap.service';

@ApiTags('到场缺口待办')
@Controller('gap')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class GapController {
  constructor(private service: GapService) {}

  @Get('todos')
  @ApiOperation({ summary: '缺口待办列表' })
  list(@Query('status') status = 'pending') {
    return this.service.list(status);
  }

  @Get(':registrationId/suggestions')
  @ApiOperation({ summary: '补位候选人建议(按质量评分)' })
  suggestions(@Param('registrationId') registrationId: string) {
    return this.service.suggestions(registrationId);
  }

  @Post(':registrationId/handle')
  @ApiOperation({ summary: '处理缺口 (confirmed / replaced / closed_gap / contacted)' })
  handle(@Param('registrationId') registrationId: string, @Body() body: { action: string; note?: string }, @Req() req: any) {
    return this.service.handle(registrationId, body.action, body.note || '', req.user.sub);
  }
}
