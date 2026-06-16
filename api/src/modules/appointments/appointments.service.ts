import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../../entities/appointment.entity.js';
import { Room } from '../../entities/room.entity.js';
import { ExceptionOrder } from '../../entities/exception-order.entity.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { PaginatedResult } from '../../common/types/paginated-result.type.js';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Room)
    private readonly roomRepo: Repository<Room>,
    @InjectRepository(ExceptionOrder)
    private readonly exceptionOrderRepo: Repository<ExceptionOrder>,
  ) {}

  async create(dto: CreateAppointmentDto): Promise<{ appointment: Appointment; exceptionOrder?: ExceptionOrder }> {
    const room = await this.roomRepo.findOne({ where: { id: dto.roomId } });
    if (!room) throw new NotFoundException(`Room #${dto.roomId} not found`);

    let exceptionOrder: ExceptionOrder | undefined;

    if (room.status === 'rented' || room.status === 'maintenance') {
      exceptionOrder = this.exceptionOrderRepo.create({
        sourceType: 'appointment',
        sourceId: 0,
        roomId: room.id,
        title: `预约冲突：房间 ${room.name} 当前状态为 ${room.status}`,
        description: `用户尝试预约房间 ${room.name}，但房间当前处于${room.status === 'rented' ? '已出租' : '维护中'}状态，无法接受新预约。`,
        severity: 'high',
        status: 'open',
      });
      exceptionOrder = await this.exceptionOrderRepo.save(exceptionOrder);
    }

    const appointment = this.appointmentRepo.create({
      ...dto,
      appointmentTime: new Date(dto.appointmentTime),
      status: 'pending',
    });
    const saved = await this.appointmentRepo.save(appointment);

    if (exceptionOrder) {
      exceptionOrder.sourceId = saved.id;
      await this.exceptionOrderRepo.save(exceptionOrder);
    }

    return { appointment: saved, exceptionOrder };
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Appointment>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await this.appointmentRepo.findAndCount({
      where,
      relations: ['room', 'user'],
      order: { id: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({ where: { id }, relations: ['room', 'user'] });
    if (!appointment) throw new NotFoundException(`Appointment #${id} not found`);
    return appointment;
  }

  async update(id: number, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    const raw = dto as Record<string, any>;
    if (raw.appointmentTime) {
      Object.assign(appointment, dto, { appointmentTime: new Date(raw.appointmentTime) });
    } else {
      Object.assign(appointment, dto);
    }
    return this.appointmentRepo.save(appointment);
  }

  async updateStatus(id: number, status: string): Promise<Appointment> {
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status: ${status}`);
    }
    const appointment = await this.findOne(id);
    appointment.status = status as any;
    return this.appointmentRepo.save(appointment);
  }

  async remove(id: number): Promise<void> {
    const appointment = await this.findOne(id);
    await this.appointmentRepo.remove(appointment);
  }
}
