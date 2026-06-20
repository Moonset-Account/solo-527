import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService, CreateNotificationDto } from './notification.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { NotificationStatus, NotificationType } from '../../entities/notification.entity';

@ApiTags('通知管理')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('my')
  async getMyNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
  ) {
    return this.service.getMyNotifications(user.id, page, pageSize, status, type);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return { count: await this.service.getUnreadCount(user.id) };
  }

  @Post(':id/read')
  async readNotification(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.readNotification(id, user.id);
  }

  @Post('read-all')
  async readAll(@CurrentUser() user: CurrentUserPayload) {
    return this.service.readAll(user.id);
  }

  @Post('send')
  @RequirePermissions('notification:send')
  async send(@Body() dto: CreateNotificationDto) {
    return this.service.createNotification(dto);
  }
}
