import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Timeline } from './entities/timeline.entity';
import { CreateTimelineDto, QueryTimelinesDto } from './dto/timeline.dto';

@Injectable()
export class TimelinesService {
  constructor(
    @InjectRepository(Timeline)
    private timelinesRepository: Repository<Timeline>,
  ) {}

  async create(dto: CreateTimelineDto, operatorId: string) {
    const timeline = this.timelinesRepository.create({
      ...dto,
      operatorId: dto.operatorId || operatorId,
      createdBy: operatorId,
    });
    return this.timelinesRepository.save(timeline);
  }

  async findAll(query: QueryTimelinesDto) {
    const { orderId, eventType, operatorId, startDate, endDate } = query;
    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (eventType) where.eventType = eventType;
    if (operatorId) where.operatorId = operatorId;
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    return this.timelinesRepository.find({
      where,
      relations: ['operator'],
      order: { createdAt: 'ASC' },
    });
  }

  async findByOrderId(orderId: string) {
    return this.timelinesRepository.find({
      where: { orderId },
      relations: ['operator'],
      order: { createdAt: 'ASC' },
    });
  }
}
