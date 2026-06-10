import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('rules')
  create(@Body() createReminderDto: any, @CurrentUser('_id') userId: string) {
    return this.remindersService.create(createReminderDto, userId);
  }

  @Get('rules')
  findAll(@Query() query: any) {
    return this.remindersService.findAll(query);
  }

  @Get('rules/category/:category')
  findByCategory(@Param('category') category: any) {
    return this.remindersService.findByCategory(category);
  }

  @Get('rules/list')
  getReminders() {
    return this.remindersService.getReminders();
  }

  @Get('rules/:id')
  findOne(@Param('id') id: string) {
    return this.remindersService.findById(id);
  }

  @Patch('rules/:id')
  update(
    @Param('id') id: string,
    @Body() updateReminderDto: any,
    @CurrentUser('_id') userId: string,
  ) {
    return this.remindersService.update(id, updateReminderDto, userId);
  }

  @Patch('rules/:id/toggle')
  toggleEnabled(
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
    @CurrentUser('_id') userId: string,
  ) {
    return this.remindersService.toggleEnabled(id, body.enabled, userId);
  }

  @Delete('rules/:id')
  remove(@Param('id') id: string) {
    return this.remindersService.remove(id);
  }
}
