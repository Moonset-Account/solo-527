import { Controller, Get, Post, Put, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ConflictService, CreateConflictDto, UpdateConflictDto, QueryConflictDto } from './conflict.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('资源冲突')
@ApiBearerAuth()
@Controller('conflicts')
export class ConflictController {
  constructor(private readonly service: ConflictService) {}

  @Post()
  @RequirePermissions('conflict:view')
  async create(@Body() dto: CreateConflictDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.createConflict(dto, user);
  }

  @Get('stats')
  @RequirePermissions('conflict:view')
  async getStats() {
    return this.service.getStats();
  }

  @Get('query')
  @RequirePermissions('conflict:view')
  async query(@Query() query: QueryConflictDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.queryConflicts(query, user);
  }

  @Get(':id')
  @RequirePermissions('conflict:view')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getConflict(id);
  }

  @Put(':id')
  @RequirePermissions('conflict:handle')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConflictDto,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateConflict(id, dto, user);
  }
}
