import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DictionaryService } from './dictionary.service';
import {
  CreateDictionaryDto,
  UpdateDictionaryDto,
  CreateNotificationConfigDto,
  UpdateNotificationConfigDto,
  QueryDictionaryDto,
} from './dto/dictionary.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums/index.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('config')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('config')
export class DictionaryController {
  constructor(private readonly dictionaryService: DictionaryService) {}

  @Get('dictionaries')
  @Public()
  @ApiOperation({ summary: '获取字典列表（公开接口，用于下拉选项）' })
  async findDictionaries(@Query() query: QueryDictionaryDto) {
    return this.dictionaryService.findDictionaries(query);
  }

  @Get('dictionaries/items/:code')
  @Public()
  @ApiOperation({ summary: '根据编码获取字典项（公开）' })
  async getItems(@Param('code') code: string) {
    return this.dictionaryService.getDictionaryItems(code);
  }

  @Post('dictionaries')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '创建字典' })
  async createDictionary(@Body() dto: CreateDictionaryDto, @CurrentUser('sub') operatorId: string) {
    return this.dictionaryService.createDictionary(dto, operatorId);
  }

  @Put('dictionaries/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '更新字典' })
  async updateDictionary(
    @Param('id') id: string,
    @Body() dto: UpdateDictionaryDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.dictionaryService.updateDictionary(id, dto, operatorId);
  }

  @Delete('dictionaries/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '删除字典' })
  async deleteDictionary(@Param('id') id: string, @CurrentUser('sub') operatorId: string) {
    return this.dictionaryService.deleteDictionary(id, operatorId);
  }

  @Get('notification-configs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '获取通知配置列表' })
  async findNotificationConfigs() {
    return this.dictionaryService.findNotificationConfigs();
  }

  @Post('notification-configs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '创建通知配置' })
  async createNotificationConfig(
    @Body() dto: CreateNotificationConfigDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.dictionaryService.createNotificationConfig(dto, operatorId);
  }

  @Put('notification-configs/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER)
  @ApiOperation({ summary: '更新通知配置' })
  async updateNotificationConfig(
    @Param('id') id: string,
    @Body() dto: UpdateNotificationConfigDto,
    @CurrentUser('sub') operatorId: string,
  ) {
    return this.dictionaryService.updateNotificationConfig(id, dto, operatorId);
  }
}
