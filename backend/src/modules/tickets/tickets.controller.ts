import { Controller, Get, Post, Put, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TicketsService } from './tickets.service';

@ApiTags('票种库存')
@Controller('ticket-types')
export class TicketsController {
  constructor(private service: TicketsService) {}

  @Get()
  @ApiOperation({ summary: '票种列表 (公开/管理员)' })
  list(@Query('includeOff') includeOff: any) {
    return this.service.list(includeOff === 'true' || includeOff === true);
  }

  @Get(':id')
  @ApiOperation({ summary: '票种详情' })
  get(@Param('id') id: string) {
    return this.service.get(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建票种' })
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新票种' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '开售/停售' })
  setStatus(@Param('id') id: string, @Body('isOnSale') isOnSale: boolean) {
    return this.service.setStatus(id, isOnSale);
  }

  @Patch(':id/inventory')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '调整库存' })
  adjustInventory(@Param('id') id: string, @Body() body: { delta: number; reason: string }, @Body('operatorId') operatorId: string) {
    return this.service.adjustInventory(id, body.delta, body.reason, operatorId);
  }

  @Get(':id/history')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: '库存变更历史' })
  history(@Param('id') id: string) {
    return this.service.getHistory(id);
  }
}
