import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ConfigItemService } from './config-item.service.js';
import { CreateConfigItemDto } from './dto/create-config-item.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('api/config-items')
@UseGuards(JwtAuthGuard)
export class ConfigItemController {
  constructor(private configItemService: ConfigItemService) {}

  @Get()
  findAll(
    @Query('assetId') assetId?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.configItemService.findAll({
      assetId: assetId ? parseInt(assetId, 10) : undefined,
      keyword,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.configItemService.findOne(id);
  }

  @Post()
  create(
    @Body() createConfigItemDto: CreateConfigItemDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.configItemService.create(createConfigItemDto, user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConfigItemDto: Partial<CreateConfigItemDto>,
    @CurrentUser() user: { id: number },
  ) {
    return this.configItemService.update(id, updateConfigItemDto, user.id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.configItemService.remove(id, user.id);
  }
}
