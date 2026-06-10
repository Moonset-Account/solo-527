import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DelayReminder } from './delay-reminder.entity';
import { CreateDelayReminderDto } from './dto/create-delay-reminder.dto';
import { UpdateDelayReminderDto } from './dto/update-delay-reminder.dto';
import { PaginationDto, PaginatedResult } from '../common/dto/pagination.dto';
import { DelayReminderStatus } from '../common/enums/delay-reminder-status.enum';

@Injectable()
export class DelayReminderService {
  constructor(
    @InjectRepository(DelayReminder)
    private delayReminderRepository: Repository<DelayReminder>,
  ) {}

  async findAll(paginationDto: PaginationDto, projectId?: number, status?: string): Promise<PaginatedResult<DelayReminder>> {
    const { page = 1, pageSize = 10 } = paginationDto;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (projectId) {
      where.projectId = projectId;
    }
    if (status) {
      where.status = status;
    }

    const [list, total] = await this.delayReminderRepository.findAndCount({
      where,
      relations: ['project', 'stage'],
      skip,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });

    return { list, total, page, pageSize };
  }

  async findOne(id: number): Promise<DelayReminder> {
    const reminder = await this.delayReminderRepository.findOne({
      where: { id },
      relations: ['project', 'stage'],
    });
    if (!reminder) {
      throw new NotFoundException(`DelayReminder with id ${id} not found`);
    }
    return reminder;
  }

  async findByProjectId(projectId: number): Promise<DelayReminder[]> {
    return this.delayReminderRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(createDto: CreateDelayReminderDto): Promise<DelayReminder> {
    const reminder = this.delayReminderRepository.create({
      ...createDto,
      remindTime: new Date(),
    });
    return this.delayReminderRepository.save(reminder);
  }

  async createIfNotExists(createDto: CreateDelayReminderDto): Promise<DelayReminder | null> {
    const existing = await this.delayReminderRepository.findOne({
      where: {
        projectId: createDto.projectId,
        stageId: createDto.stageId,
        status: 'PENDING' as any,
      },
    });

    if (existing) {
      return null;
    }

    return this.create(createDto);
  }

  async update(id: number, updateDto: UpdateDelayReminderDto): Promise<DelayReminder> {
    const reminder = await this.findOne(id);
    Object.assign(reminder, updateDto);
    return this.delayReminderRepository.save(reminder);
  }

  async resolve(id: number, handler?: string): Promise<DelayReminder> {
    const reminder = await this.findOne(id);
    reminder.status = DelayReminderStatus.RESOLVED;
    if (handler) {
      reminder.handler = handler;
    }
    return this.delayReminderRepository.save(reminder);
  }

  async remove(id: number): Promise<void> {
    const result = await this.delayReminderRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`DelayReminder with id ${id} not found`);
    }
  }
}
