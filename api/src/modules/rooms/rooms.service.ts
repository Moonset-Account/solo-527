import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
  ) {}

  async create(dto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepo.create(dto);
    return this.roomRepo.save(room);
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Room>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.roomRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomRepo.findOne({ where: { id } });
    if (!room) throw new NotFoundException(`Room #${id} not found`);
    return room;
  }

  async update(id: number, dto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, dto);
    return this.roomRepo.save(room);
  }

  async remove(id: number): Promise<void> {
    const room = await this.findOne(id);
    await this.roomRepo.remove(room);
  }
}
