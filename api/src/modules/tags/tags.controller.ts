import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { UpdateTagDto } from './dto/update-tag.dto.js';
import { BatchQueryTagDto } from './dto/batch-query-tag.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private tagsService: TagsService) {}

  @Get()
  async findAll(@Query('group') group?: string) {
    return this.tagsService.findAll(group);
  }

  @Get('profile')
  async getProfile(@Query('name') name: string) {
    return this.tagsService.getProfile(name);
  }

  @Post()
  async create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto) {
    return this.tagsService.update(id, updateTagDto);
  }

  @Post('batch-query')
  async batchQuery(@Body() batchQueryDto: BatchQueryTagDto) {
    return this.tagsService.batchQuery(batchQueryDto);
  }
}
