import { Controller, Get, Put, Body, Param, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.settingsService.findAll(query);
  }

  @Public()
  @Get('all')
  getAll() {
    return this.settingsService.getAll();
  }

  @Public()
  @Get('group/:group')
  getByGroup(@Param('group') group: string) {
    return this.settingsService.getByGroup(group);
  }

  @Public()
  @Get(':key')
  findByKey(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @Put(':key')
  update(
    @Param('key') key: string,
    @Body() body: { value: string },
    @CurrentUser('_id') userId: string,
  ) {
    return this.settingsService.update(key, body.value, userId);
  }

  @Put('batch')
  batchUpdate(
    @Body() settings: Array<{ key: string; value: string }>,
    @CurrentUser('_id') userId: string,
  ) {
    return this.settingsService.batchUpdate(settings, userId);
  }
}
