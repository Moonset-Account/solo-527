import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { MessageResultDto } from './dto/message-result.dto.js';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  create(@Body() dto: CreateMessageDto) {
    return this.messagesService.create(dto);
  }

  @Get()
  findAll() {
    return this.messagesService.findAll();
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
