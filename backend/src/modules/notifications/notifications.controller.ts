import {
  Controller,
  Get,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationType, NotificationPriority } from './schemas/notification.schema';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll(
    @Query('isRead') isRead?: string,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @CurrentUser() user?: any,
  ) {
    return this.service.findByUser(user.sub, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type,
      priority,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 20,
    });
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return this.service.getUnreadCount(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.findOne(id, user.sub);
  }

  @Patch(':id/read')
  @HttpCode(200)
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markAsRead(id, user.sub);
  }

  @Patch('read-all')
  @HttpCode(200)
  markAllAsRead(@CurrentUser() user: any) {
    return this.service.markAllAsRead(user.sub);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.remove(id, user.sub);
  }
}
