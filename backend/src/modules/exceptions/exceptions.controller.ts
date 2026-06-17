import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExceptionsService } from './exceptions.service';

@ApiTags('异常关闭复盘')
@Controller('exceptions')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class ExceptionsController {
  constructor(private service: ExceptionsService) {}

  @Get('reasons')
  @ApiOperation({ summary: '关闭原因字典(及统计)' })
  reasons() {
    return this.service.listReasons();
  }

  @Get()
  @ApiOperation({ summary: '异常关闭列表(复盘)' })
  list(@Query() query: any) {
    return this.service.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '异常详情' })
  detail(@Param('id') id: string) {
    return this.service.detail(id);
  }

  @Get(':id/trace')
  @ApiOperation({ summary: '原单追溯(完整链路)' })
  trace(@Param('id') id: string) {
    return this.service.traceOriginal(id);
  }
}
