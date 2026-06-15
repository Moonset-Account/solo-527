import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { ItemService, type PaginatedResult } from './item.service.js';
import { CreateItemDto } from './dto/create-item.dto.js';
import { UpdateItemDto } from './dto/update-item.dto.js';
import { ProgressDto } from './dto/progress.dto.js';
import type { IItem, IProgress, IUser, ItemStatus } from '../../common/types/index.js';

@Controller('items')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Get()
  @Roles('pm', 'admin')
  async findAll(
    @Query()
    query: {
      page?: string;
      pageSize?: string;
      status?: ItemStatus;
      department?: string;
      assignee?: string;
      keyword?: string;
    },
  ): Promise<PaginatedResult<IItem>> {
    return this.itemService.findAll({
      ...query,
      page: query.page ? parseInt(query.page, 10) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  @Roles('pm', 'admin')
  async findById(
    @Param('id') id: string,
  ): Promise<IItem & { progressList: IProgress[]; attachments: any[] }> {
    return this.itemService.findById(id);
  }

  @Post()
  @Roles('admin')
  async create(
    @Body() data: CreateItemDto,
    @CurrentUser() user: IUser,
  ): Promise<IItem> {
    return this.itemService.create(data, user._id);
  }

  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body() data: UpdateItemDto,
    @CurrentUser() user: IUser,
  ): Promise<IItem> {
    return this.itemService.update(id, data, user._id);
  }

  @Post(':id/claim')
  @Roles('pm', 'admin')
  async claim(
    @Param('id') id: string,
    @CurrentUser() user: IUser,
  ): Promise<IItem> {
    return this.itemService.claim(id, user._id);
  }

  @Post(':id/progress')
  @Roles('pm', 'admin')
  async addProgress(
    @Param('id') id: string,
    @Body() data: ProgressDto,
    @CurrentUser() user: IUser,
  ): Promise<IProgress> {
    return this.itemService.addProgress(id, data.content, data.attachments, user._id);
  }
}
