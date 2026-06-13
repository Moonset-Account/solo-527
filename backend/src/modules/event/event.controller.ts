import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile as NestUploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EventService, UploadedFile } from './event.service';
import { CreateEventDto, UpdateEventDto, QueryEventDto, CreateNoteDto } from './dto/event.dto';
import { Event } from './entities/event.entity';
import { Note } from './entities/note.entity';
import { Attachment } from './entities/attachment.entity';
import { History } from './entities/history.entity';

@Controller('events')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.eventService.create(createEventDto);
  }

  @Get()
  findAll(@Query() query?: QueryEventDto): Promise<Event[]> {
    return this.eventService.findAll(query);
  }

  @Get('stats')
  getStats(): Promise<any> {
    return this.eventService.getEventStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Event> {
    return this.eventService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto): Promise<Event> {
    return this.eventService.update(id, updateEventDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Body('operatorId') operatorId: string): Promise<void> {
    return this.eventService.remove(id, operatorId);
  }

  @Post(':id/notes')
  addNote(@Body() createNoteDto: CreateNoteDto): Promise<Note> {
    return this.eventService.addNote(createNoteDto);
  }

  @Get(':id/notes')
  getNotes(@Param('id') id: string): Promise<Note[]> {
    return this.eventService.getNotes(id);
  }

  @Get(':id/attachments')
  getAttachments(@Param('id') id: string): Promise<Attachment[]> {
    return this.eventService.getAttachments(id);
  }

  @Post(':id/attachments')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadAttachment(
    @Param('id') eventId: string,
    @Body('uploaderId') uploaderId: string,
    @NestUploadedFile() file: UploadedFile,
  ): Promise<Attachment> {
    return this.eventService.addAttachment(eventId, uploaderId, file);
  }

  @Get(':id/histories')
  getHistories(@Param('id') id: string): Promise<History[]> {
    return this.eventService.getHistories(id);
  }
}
