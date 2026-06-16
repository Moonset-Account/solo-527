import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageRecord } from '../../entities/message-record.entity.js';
import { CreateMessageDto } from './dto/create-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { MessageResultDto } from './dto/message-result.dto.js';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageRecord)
    private readonly messageRepo: Repository<MessageRecord>,
  ) {}

  async create(dto: CreateMessageDto): Promise<MessageRecord> {
    const message = this.messageRepo.create({
      ...dto,
      status: 'pending',
    });
    return this.messageRepo.save(message);
  }

  async findAll(): Promise<MessageRecord[]> {
    return this.messageRepo.find({ relations: ['user'], order: { id: 'ASC' } });
  }

  async findOne(id: number): Promise<MessageRecord> {
    const message = await this.messageRepo.findOne({ where: { id }, relations: ['user'] });
    if (!message) throw new NotFoundException(`MessageRecord #${id} not found`);
    return message;
  }

  async update(id: number, dto: UpdateMessageDto): Promise<MessageRecord> {
    const message = await this.findOne(id);
    Object.assign(message, dto);
    return this.messageRepo.save(message);
  }

  async remove(id: number): Promise<void> {
    const message = await this.findOne(id);
    await this.messageRepo.remove(message);
  }

  async retry(id: number): Promise<MessageRecord> {
    const message = await this.findOne(id);
    if (message.status !== 'failed') {
      throw new BadRequestException('Only failed messages can be retried');
    }
    message.retryCount += 1;
    message.status = 'pending';
    message.errorMessage = '';
    return this.messageRepo.save(message);
  }

  async updateResult(id: number, dto: MessageResultDto): Promise<MessageRecord> {
    const message = await this.findOne(id);
    message.status = dto.status;
    if (dto.status === 'sent') {
      message.sentAt = new Date();
      message.providerMessageId = dto.providerMessageId ?? '';
      message.errorMessage = '';
    } else if (dto.status === 'failed') {
      message.errorMessage = dto.errorMessage ?? '';
    }
    return this.messageRepo.save(message);
  }
}
