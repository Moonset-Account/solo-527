import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SessionsService } from './sessions.service';

@ApiTags('场次座位')
@Controller('sessions')
export class SessionsController {
  constructor(private service: SessionsService) {}

  @Get()
  @ApiOperation({ summary: '场次列表' })
  list(@Query('onlyActive') onlyActive: any) {
    return this.service.list(onlyActive !== 'false');
  }

  @Get(':id')
  @ApiOperation({ summary: '场次详情' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建场次' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新场次' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: '获取座位图' })
  seats(@Param('id') id: string) {
    return this.service.getSeats(id);
  }

  @Patch(':id/seats/:seatId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新座位状态' })
  updateSeat(@Param('id') id: string, @Param('seatId') seatId: string, @Body() body: any) {
    return this.service.updateSeat(id, seatId, body);
  }

  @Patch(':id/quality-weight')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '设置场次质量权重' })
  setQuality(@Param('id') id: string, @Body('qualityWeight') qualityWeight: number) {
    return this.service.setQualityWeight(id, qualityWeight);
  }
}
