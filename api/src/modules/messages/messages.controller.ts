import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { MessageResultDto } from './dto/message-result.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.messagesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMessageDto) {
    return this.messagesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.remove(id);
  }

  @Post(':id/retry')
  retry(@Param('id', ParseIntPipe) id: number) {
    return this.messagesService.retry(id);
  }

  @Put(':id/result')
  updateResult(@Param('id', ParseIntPipe) id: number, @Body() dto: MessageResultDto) {
    return this.messagesService.updateResult(id, dto);
  }
}
