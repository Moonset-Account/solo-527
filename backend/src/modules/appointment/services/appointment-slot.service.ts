import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AppointmentSlot } from '../entities/appointment-slot.entity';
import { CreateAppointmentSlotDto } from '../dto/appointment.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';

@Injectable()
export class AppointmentSlotService {
  constructor(
    @InjectRepository(AppointmentSlot)
    private readonly slotRepository: Repository<AppointmentSlot>,
    private readonly operationLogService: OperationLogService,
  ) {}

  async create(dto: CreateAppointmentSlotDto, operator: CurrentUserPayload) {
    const existing = await this.slotRepository.findOne({
      where: {
        doctorId: dto.doctorId,
        date: new Date(dto.date),
        startTime: dto.startTime,
      },
    });
    if (existing) {
      throw new BadRequestException('该时段号源已存在');
    }

    const slot = this.slotRepository.create({
      ...dto,
      date: new Date(dto.date),
      clinicId: operator.clinicId,
    });

    const saved = await this.slotRepository.save(slot);

    await this.operationLogService.createLog({
      module: '预约管理',
      action: '创建号源',
      targetType: 'AppointmentSlot',
      targetId: saved.id,
      newValue: { date: dto.date, startTime: dto.startTime, endTime: dto.endTime },
      user: operator,
    });

    return saved;
  }

  async findByDoctorAndDate(doctorId: string, date: string, clinicId?: string) {
    const queryBuilder = this.slotRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .where('slot.date = :date', { date: new Date(date) });

    if (doctorId) {
      queryBuilder.andWhere('slot.doctor_id = :doctorId', { doctorId });
    }
    if (clinicId) {
      queryBuilder.andWhere('slot.clinic_id = :clinicId', { clinicId });
    }

    const slots = await queryBuilder
      .orderBy('slot.start_time', 'ASC')
      .getMany();

    return slots;
  }

  async getSlotUtilization(date: string, clinicId: string) {
    const slots = await this.slotRepository
      .createQueryBuilder('slot')
      .where('slot.date = :date', { date: new Date(date) })
      .andWhere('slot.clinic_id = :clinicId', { clinicId })
      .getMany();

    const total = slots.length;
    const available = slots.filter(s => s.status === 'available' && s.bookedCount < s.maxPatients).length;
    const full = slots.filter(s => s.status === 'full' || s.bookedCount >= s.maxPatients).length;
    const utilization = total > 0 ? Math.round((full / total) * 100) : 0;

    return {
      total,
      available,
      full,
      utilization,
      slots,
    };
  }

  async findOne(id: string) {
    const slot = await this.slotRepository.findOne({
      where: { id },
      relations: ['doctor', 'doctor.user'],
    });
    if (!slot) {
      throw new NotFoundException('号源不存在');
    }
    return slot;
  }

  async updateStatus(id: string, status: string, operator: CurrentUserPayload) {
    const slot = await this.slotRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    const oldStatus = slot.status;
    slot.status = status;
    const saved = await this.slotRepository.save(slot);

    await this.operationLogService.createLog({
      module: '预约管理',
      action: '更新号源状态',
      targetType: 'AppointmentSlot',
      targetId: id,
      oldValue: { status: oldStatus },
      newValue: { status },
      user: operator,
    });

    return saved;
  }

  async incrementBookedCount(id: string) {
    const slot = await this.slotRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    slot.bookedCount = slot.bookedCount + 1;
    if (slot.bookedCount >= slot.maxPatients) {
      slot.status = 'full';
    }

    return await this.slotRepository.save(slot);
  }

  async decrementBookedCount(id: string) {
    const slot = await this.slotRepository.findOne({ where: { id } });
    if (!slot) {
      throw new NotFoundException('号源不存在');
    }

    slot.bookedCount = Math.max(0, slot.bookedCount - 1);
    if (slot.bookedCount < slot.maxPatients && slot.status === 'full') {
      slot.status = 'available';
    }

    return await this.slotRepository.save(slot);
  }
}
