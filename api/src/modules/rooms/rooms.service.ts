import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from '../../entities/room.entity.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { UpdateRoomDto } from './dto/update-room.dto.js';

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

  async findAll(): Promise<Room[]> {
    return this.roomRepo.find({ order: { id: 'ASC' } });
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
