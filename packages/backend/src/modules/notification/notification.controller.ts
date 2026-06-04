import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Notification, NotificationType } from '../../entities/notification.entity';
import { User } from '../../entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async findAll(
    @CurrentUser() user: User,
    @Query('isRead') isRead?: boolean,
    @Query('type') type?: NotificationType,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationService.findByUser(
      user.id,
      { isRead: isRead !== undefined ? isRead === true : undefined, type },
      Number(page),
      Number(limit),
    );
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: User): Promise<{ count: number }> {
    const count = await this.notificationService.getUnreadCount(user.id);
    return { count };
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: User): Promise<Notification> {
    return this.notificationService.markAsRead(id, user.id);
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: User): Promise<{ success: boolean }> {
    await this.notificationService.markAllAsRead(user.id);
    return { success: true };
  }
}
