import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CallbackService, CreateCallbackDto, QueryCallbackDto } from './callback.service';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('回调日志/重试')
@ApiBearerAuth()
@Controller('callbacks')
export class CallbackController {
  constructor(private readonly service: CallbackService) {}

  @Post()
  @RequirePermissions('callback:view')
  async create(@Body() dto: CreateCallbackDto, @CurrentUser() user: CurrentUserPayload) {
    return this.service.createCallback(dto, user);
  }

  @Get('stats')
  @RequirePermissions('callback:view')
  async getStats() {
    return this.service.getStats();
  }

  @Get('query')
  @RequirePermissions('callback:view')
  async query(@Query() query: QueryCallbackDto) {
    return this.service.queryCallbacks(query);
  }

  @Get(':id')
  @RequirePermissions('callback:view')
  async getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getCallback(id);
  }

  @Post(':id/retry')
  @RequirePermissions('callback:retry')
  async retry(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.retryById(id, user);
  }

  @Post(':id/cancel')
  @RequirePermissions('callback:retry')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.service.cancelById(id, user);
  }
}
