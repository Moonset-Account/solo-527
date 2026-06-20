import { Controller, Get, Post, Patch, Param, UseGuards, Query, Body } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SearchDto } from '../common/dto/search.dto';

@Controller('reminders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Get('my')
  getMyReminders(@Query() searchDto: SearchDto, @CurrentUser() user: any) {
    return this.remindersService.findByUserId(user.id, searchDto);
  }

  @Get('unread-count')
  getUnreadCount(@CurrentUser() user: any) {
    return { count: this.remindersService.getUnreadCount(user.id) };
  }

  @Get('blocking')
  getBlockingReminders(@CurrentUser() user: any) {
    return this.remindersService.getBlockingReminders(user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.remindersService.markAsRead(id, user.id);
  }

  @Post('read-all')
  markAllAsRead(@CurrentUser() user: any) {
    return { modifiedCount: this.remindersService.markAllAsRead(user.id) };
  }

  @Get('configs')
  @Roles(Role.ADMIN)
  getConfigs() {
    return this.remindersService.findAllConfigs();
  }

  @Patch('configs/:id')
  @Roles(Role.ADMIN)
  updateConfig(@Param('id') id: string, @Body() updateData: any) {
    return this.remindersService.updateConfig(id, updateData);
  }
}
