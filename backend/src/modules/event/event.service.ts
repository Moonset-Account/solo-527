import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { Attachment } from './entities/attachment.entity';
import { Note } from './entities/note.entity';
import { History } from './entities/history.entity';
import { User } from '../user/entities/user.entity';
import { CreateEventDto, UpdateEventDto, QueryEventDto, CreateNoteDto } from './dto/event.dto';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
    @InjectRepository(Note)
    private noteRepository: Repository<Note>,
    @InjectRepository(History)
    private historyRepository: Repository<History>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createEventDto: CreateEventDto): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      status: 'pending',
    });
    const savedEvent = await this.eventRepository.save(event);

    await this.createHistory(
      savedEvent.id,
      createEventDto.reporterId,
      '创建事件',
      null,
      JSON.stringify(createEventDto),
    );

    return this.findOne(savedEvent.id);
  }

  async findAll(query?: QueryEventDto): Promise<Event[]> {
    const where: any = { deleted: false };
    
    if (query?.type) where.type = query.type;
    if (query?.status) where.status = query.status;
    if (query?.assigneeId) where.assigneeId = query.assigneeId;
    if (query?.reporterId) where.reporterId = query.reporterId;
    if (query?.gridArea) where.gridArea = query.gridArea;

    if (query?.startDate && query?.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    if (query?.shift) {
      const users = await this.userRepository.find({
        where: { shift: query.shift as any, deleted: false },
        select: ['id'],
      });
      const userIds = users.map(u => u.id);
      where.assigneeId = In(userIds);
    }

    return this.eventRepository.find({
      where,
      relations: ['reporter', 'assignee', 'attachments', 'notes', 'histories', 'votes', 'tasks'],
      order: { createdAt: 'DESC', priority: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, deleted: false },
      relations: ['reporter', 'assignee', 'attachments', 'notes', 'histories', 'votes', 'tasks'],
    });
    if (!event) {
      throw new NotFoundException('事件不存在');
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findOne(id);
    const oldValue = JSON.stringify(event);

    const { operatorId, ...updateData } = updateEventDto;

    if (updateData.status === 'reviewing' && event.status !== 'reviewing') {
      updateData.reviewTime = new Date();
    }

    Object.assign(event, updateData);
    const savedEvent = await this.eventRepository.save(event);

    await this.createHistory(
      id,
      operatorId || updateData.assigneeId || event.assigneeId,
      '更新事件',
      oldValue,
      JSON.stringify(savedEvent),
      this.getChanges(JSON.parse(oldValue), savedEvent),
    );

    return this.findOne(id);
  }

  async remove(id: string, operatorId: string): Promise<void> {
    const event = await this.findOne(id);
    event.deleted = true;
    await this.eventRepository.save(event);

    await this.createHistory(
      id,
      operatorId,
      '删除事件',
      JSON.stringify(event),
      null,
    );
  }

  async addNote(createNoteDto: CreateNoteDto): Promise<Note> {
    const event = await this.findOne(createNoteDto.eventId);
    const note = this.noteRepository.create(createNoteDto);
    const savedNote = await this.noteRepository.save(note);

    await this.createHistory(
      createNoteDto.eventId,
      createNoteDto.creatorId,
      '添加备注',
      null,
      createNoteDto.content,
    );

    return savedNote;
  }

  async getNotes(eventId: string): Promise<Note[]> {
    return this.noteRepository.find({
      where: { eventId, deleted: false },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAttachments(eventId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { eventId, deleted: false },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async addAttachment(
    eventId: string,
    uploaderId: string,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    const attachment = this.attachmentRepository.create({
      eventId,
      uploaderId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
    });

    const savedAttachment = await this.attachmentRepository.save(attachment);

    await this.createHistory(
      eventId,
      uploaderId,
      '上传附件',
      null,
      file.originalname,
    );

    return savedAttachment;
  }

  async getHistories(eventId: string): Promise<History[]> {
    return this.historyRepository.find({
      where: { eventId, deleted: false },
      relations: ['operator'],
      order: { createdAt: 'DESC' },
    });
  }

  private async createHistory(
    eventId: string,
    operatorId: string,
    action: string,
    oldValue?: string,
    newValue?: string,
    changes?: string,
  ): Promise<History> {
    const history = this.historyRepository.create({
      eventId,
      operatorId,
      action,
      oldValue,
      newValue,
      changes,
    });
    return this.historyRepository.save(history);
  }

  private getChanges(oldObj: any, newObj: any): string {
    const changes: string[] = [];
    const fieldsToCheck = ['status', 'assigneeId', 'deadline', 'description', 'isRectified', 'reviewResult'];
    
    for (const field of fieldsToCheck) {
      if (oldObj[field] !== newObj[field]) {
        changes.push(`${field}: ${oldObj[field]} -> ${newObj[field]}`);
      }
    }
    
    return changes.join('; ');
  }

  async getEventStats(): Promise<any> {
    const statuses: EventStatus[] = ['pending', 'processing', 'reviewing', 'voting', 'completed', 'closed'];
    const stats: any = {};

    for (const status of statuses) {
      stats[status] = await this.eventRepository.count({
        where: { status, deleted: false },
      });
    }

    stats.rectification = await this.eventRepository.count({
      where: { type: 'rectification', deleted: false },
    });
    stats.vote = await this.eventRepository.count({
      where: { type: 'vote', deleted: false },
    });
    stats.patrol = await this.eventRepository.count({
      where: { type: 'patrol', deleted: false },
    });

    return stats;
  }
}
