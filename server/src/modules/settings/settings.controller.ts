import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SettingsService } from './settings.service';
import {
  QueryDictItemDto,
  CreateDictItemDto,
  UpdateDictItemDto,
  QuerySystemConfigDto,
  CreateSystemConfigDto,
  UpdateSystemConfigDto,
} from './dto/settings.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post('dict-items')
  createDictItem(@Body() dto: CreateDictItemDto) {
    return this.settingsService.createDictItem(dto);
  }

  @Get('dict-items')
  findAllDictItems(@Query() query: QueryDictItemDto) {
    return this.settingsService.findAllDictItems(query);
  }

  @Get('dict-items/codes')
  findAllDictCodes() {
    return this.settingsService.findAllDictCodes();
  }

  @Get('dict-items/code/:dictCode')
  findDictItemsByCode(@Param('dictCode') dictCode: string) {
    return this.settingsService.findDictItemsByCode(dictCode);
  }

  @Get('dict-items/:id')
  findOneDictItem(@Param('id') id: string) {
    return this.settingsService.findOneDictItem(id);
  }

  @Put('dict-items/:id')
  updateDictItem(@Param('id') id: string, @Body() dto: UpdateDictItemDto) {
    return this.settingsService.updateDictItem(id, dto);
  }

  @Delete('dict-items/:id')
  removeDictItem(@Param('id') id: string) {
    return this.settingsService.removeDictItem(id);
  }

  @Post('system-configs')
  createSystemConfig(@Body() dto: CreateSystemConfigDto) {
    return this.settingsService.createSystemConfig(dto);
  }

  @Get('system-configs')
  findAllSystemConfigs(@Query() query: QuerySystemConfigDto) {
    return this.settingsService.findAllSystemConfigs(query);
  }

  @Get('system-configs/groups')
  findAllConfigGroups() {
    return this.settingsService.findAllConfigGroups();
  }

  @Get('system-configs/key/:key')
  findSystemConfigByKey(@Param('key') key: string) {
    return this.settingsService.findSystemConfigByKey(key);
  }

  @Get('system-configs/group/:group')
  findSystemConfigsByGroup(@Param('group') group: string) {
    return this.settingsService.findSystemConfigsByGroup(group);
  }

  @Get('system-configs/:id')
  findOneSystemConfig(@Param('id') id: string) {
    return this.settingsService.findOneSystemConfig(id);
  }

  @Put('system-configs/:id')
  updateSystemConfig(@Param('id') id: string, @Body() dto: UpdateSystemConfigDto) {
    return this.settingsService.updateSystemConfig(id, dto);
  }

  @Delete('system-configs/:id')
  removeSystemConfig(@Param('id') id: string) {
    return this.settingsService.removeSystemConfig(id);
  }
}
