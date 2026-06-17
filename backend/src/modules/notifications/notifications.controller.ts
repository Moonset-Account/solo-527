import { Controller, Get, Put, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@ApiTags('通知中心')
@Controller()
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @Get('notification-templates')
  @ApiOperation({ summary: '模板列表' })
  listTemplates(@Query('onlyActive') onlyActive: any) {
    return this.service.listTemplates(onlyActive !== 'false');
  }

  @Get('notification-templates/:id')
  @ApiOperation({ summary: '模板详情' })
  getTemplate(@Param('id') id: string) {
    return this.service.getTemplate(id);
  }

  @Put('notification-templates/:id')
  @ApiOperation({ summary: '更新模板' })
  updateTemplate(@Param('id') id: string, @Body() body: any) {
    return this.service.updateTemplate(id, body);
  }

  @Post('notifications/send')
  @ApiOperation({ summary: '批量发送通知' })
  send(@Body() body: { audience: any; templateId?: string; templateCode?: string; variables?: Record<string, any> }) {
    return this.service.send(body);
  }

  @Get('notifications/history')
  @ApiOperation({ summary: '发送记录' })
  history(@Query() query: any) {
    return this.service.listHistory(query);
  }
}
