import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GuestsService } from './guests.service';

@ApiTags('嘉宾管理')
@Controller('guests')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class GuestsController {
  constructor(private service: GuestsService) {}

  @Get()
  @ApiOperation({ summary: '嘉宾列表' })
  list(@Query('keyword') keyword: string) {
    return this.service.list(keyword);
  }

  @Post()
  @ApiOperation({ summary: '创建嘉宾' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id/quota')
  @ApiOperation({ summary: '调整嘉宾配额' })
  updateQuota(@Param('id') id: string, @Body('totalQuota') totalQuota: number) {
    return this.service.updateQuota(id, totalQuota);
  }

  @Post(':id/allocations')
  @ApiOperation({ summary: '分配嘉宾名额' })
  allocate(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.service.allocate(id, body, req.user.sub);
  }

  @Get(':id/allocations')
  @ApiOperation({ summary: '分配历史记录' })
  listAllocations(@Param('id') id: string) {
    return this.service.listAllocations(id);
  }
}
