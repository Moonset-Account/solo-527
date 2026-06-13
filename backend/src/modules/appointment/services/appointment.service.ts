import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from '../entities/appointment.entity';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentListQueryDto } from '../dto/appointment.dto';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';
import { OperationLogService } from '../../log/services/operation-log.service';
import { AppointmentSlotService } from './appointment-slot.service';
import { ReminderService } from '../../reminder/services/reminder.service';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly slotService: AppointmentSlotService,
    private readonly operationLogService: OperationLogService,
    private readonly reminderService: ReminderService,
  ) {}

  async create(dto: CreateAppointmentDto, operator: CurrentUserPayload) {
    const slot = await this.slotService.findOne(dto.slotId);
    if (slot.status === 'full' || slot.bookedCount >= slot.maxPatients) {
      throw new BadRequestException('该号源已满');
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      clinicId: operator.clinicId,
      createdById: operator.id,
    });

    const saved = await this.appointmentRepository.save(appointment);

    await this.slotService.incrementBookedCount(dto.slotId);

    await this.reminderService.createFromAppointment(saved, operator);

    await this.operationLogService.createLog({
      module: '预约管理',
      action: '创建预约',
      targetType: 'Appointment',
      targetId: saved.id,
      newValue: { patientId: dto.patientId, doctorId: dto.doctorId, chiefComplaint: dto.chiefComplaint },
      user: operator,
    });

    return saved;
  }

  async findAll(query: AppointmentListQueryDto, clinicId?: string) {
    const { page = 1, pageSize = 20, ...filters } = query;
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('doctor.user', 'doctorUser')
      .leftJoinAndSelect('appointment.slot', 'slot');

    if (clinicId) {
      queryBuilder.andWhere('appointment.clinic_id = :clinicId', { clinicId });
    }
    if (filters.doctorId) {
      queryBuilder.andWhere('appointment.doctor_id = :doctorId', { doctorId: filters.doctorId });
    }
    if (filters.patientId) {
      queryBuilder.andWhere('appointment.patient_id = :patientId', { patientId: filters.patientId });
    }
    if (filters.date) {
      queryBuilder.andWhere('DATE(appointment.created_at) = :date', { date: filters.date });
    }
    if (filters.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }
    if (filters.appointmentType) {
      queryBuilder.andWhere('appointment.appointment_type = :appointmentType', { appointmentType: filters.appointmentType });
    }

    const [items, total] = await queryBuilder
      .orderBy('appointment.created_at', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor', 'doctor.user', 'slot', 'createdBy'],
    });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, operator: CurrentUserPayload) {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    const oldValue = { status: appointment.status, chiefComplaint: appointment.chiefComplaint };

    if (dto.chiefComplaint !== undefined) appointment.chiefComplaint = dto.chiefComplaint;
    if (dto.status !== undefined) appointment.status = dto.status;
    if (dto.cancelReason !== undefined) appointment.cancelReason = dto.cancelReason;

    if (dto.status === 'completed') {
      appointment.completedTime = new Date();
    }
    if (dto.status === 'cancelled' && appointment.status !== 'cancelled') {
      await this.slotService.decrementBookedCount(appointment.slotId);
    }

    const saved = await this.appointmentRepository.save(appointment);

    await this.operationLogService.createLog({
      module: '预约管理',
      action: '更新预约',
      targetType: 'Appointment',
      targetId: id,
      oldValue,
      newValue: dto,
      user: operator,
    });

    return saved;
  }

  async checkIn(id: string, operator: CurrentUserPayload) {
    const appointment = await this.appointmentRepository.findOne({ where: { id } });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    appointment.checkInTime = new Date();
    appointment.status = 'confirmed';

    const saved = await this.appointmentRepository.save(appointment);

    await this.operationLogService.createLog({
      module: '预约管理',
      action: '患者签到',
      targetType: 'Appointment',
      targetId: id,
      user: operator,
    });

    return saved;
  }
}
