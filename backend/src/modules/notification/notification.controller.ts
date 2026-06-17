import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Observable, interval, fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { QueryNotificationDto, CreateNotificationDto } from './dto/notification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/index.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RedisService } from '../../common/redis/redis.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取我的通知列表' })
  async findMy(
    @CurrentUser('sub') userId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationService.findMyNotifications(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读消息数量' })
  async getUnreadCount(@CurrentUser('sub') userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: '标记已读' })
  async markAsRead(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationService.markAsRead(id, userId);
  }

  @Put('read-all')
  @ApiOperation({ summary: '全部标记已读' })
  async markAllAsRead(@CurrentUser('sub') userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认处理通知（用于样本去向不明等需要确认的）' })
  async confirm(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.notificationService.confirm(id, userId);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: '手动发送通知' })
  async create(@Body() dto: CreateNotificationDto) {
    return this.notificationService.create(dto);
  }

  @Get('maintenance-board')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER, UserRole.LAB_MANAGER)
  @ApiOperation({ summary: '获取维保及时看板数据' })
  async getMaintenanceBoard() {
    return this.notificationService.getMaintenanceBoard();
  }
}
