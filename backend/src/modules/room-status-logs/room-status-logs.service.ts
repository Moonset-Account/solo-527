import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoomStatusLog } from './entities/room-status-log.entity';
import { CreateRoomStatusLogDto } from './dto/create-room-status-log.dto';

@Injectable()
export class RoomStatusLogsService {
  constructor(
    @InjectRepository(RoomStatusLog)
    private roomStatusLogRepository: Repository<RoomStatusLog>,
  ) {}

  async create(
    createRoomStatusLogDto: CreateRoomStatusLogDto,
    operatorId?: string,
  ): Promise<RoomStatusLog> {
    const log = this.roomStatusLogRepository.create({
      ...createRoomStatusLogDto,
      operatorId,
    });
    return this.roomStatusLogRepository.save(log);
  }

  async findByPropertyId(propertyId: string): Promise<RoomStatusLog[]> {
    return this.roomStatusLogRepository.find({
      where: { propertyId },
      order: { createdAt: 'DESC' },
      relations: ['operator'],
    });
  }

  async findAll(
    propertyId?: string,
    page: number = 1,
    pageSize: number = 10,
  ): Promise<{ items: RoomStatusLog[]; total: number; page: number; pageSize: number }> {
    const skip = (page - 1) * pageSize;

    const queryBuilder = this.roomStatusLogRepository.createQueryBuilder('log');

    if (propertyId) {
      queryBuilder.andWhere('log.propertyId = :propertyId', { propertyId });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');
    queryBuilder.leftJoinAndSelect('log.operator', 'operator');
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<RoomStatusLog> {
    const log = await this.roomStatusLogRepository.findOne({
      where: { id },
      relations: ['property', 'operator'],
    });
    if (!log) {
      throw new NotFoundException(`RoomStatusLog with ID ${id} not found`);
    }
    return log;
  }
}
