import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In, FindOptionsWhere } from 'typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
  ) {}

  async findAll(
    status?: AppointmentStatus,
    counselorId?: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Appointment[]; total: number }> {
    const where: FindOptionsWhere<Appointment> = {};

    if (status) {
      where.status = status;
    }
    if (counselorId) {
      where.counselorId = counselorId;
    }
    if (startDate && endDate) {
      where.appointmentTime = Between(new Date(startDate), new Date(endDate));
    }

    const [data, total] = await this.appointmentsRepository.findAndCount({
      where,
      relations: ['counselor', 'package'],
      order: { appointmentTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  findOne(id: string): Promise<Appointment | null> {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['counselor', 'package'],
    });
  }

  create(appointment: Partial<Appointment>): Promise<Appointment> {
    const newAppointment = this.appointmentsRepository.create({
      ...appointment,
      status: AppointmentStatus.PENDING,
    });
    return this.appointmentsRepository.save(newAppointment);
  }

  async update(
    id: string,
    appointment: Partial<Appointment>,
    operatorId?: string,
    operatorName?: string,
  ): Promise<Appointment | null> {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('预约不存在');
    }

    const updateData: Partial<Appointment> = { ...appointment };
    if (operatorId && operatorName) {
      updateData.lastOperatorId = operatorId;
      updateData.lastOperatorName = operatorName;
    }

    await this.appointmentsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async updateStatus(
    id: string,
    status: AppointmentStatus,
    operatorId?: string,
    operatorName?: string,
  ): Promise<Appointment | null> {
    return this.update(id, { status }, operatorId, operatorName);
  }

  async remove(id: string): Promise<void> {
    await this.appointmentsRepository.delete(id);
  }

  async getTodayAppointments(counselorId?: string): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: FindOptionsWhere<Appointment> = {
      appointmentTime: Between(today, tomorrow),
    };
    if (counselorId) {
      where.counselorId = counselorId;
    }

    return this.appointmentsRepository.find({
      where,
      relations: ['counselor', 'package'],
      order: { appointmentTime: 'ASC' },
    });
  }

  async getStatistics(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const total = await this.appointmentsRepository.count({
      where: { appointmentTime: Between(start, end) },
    });

    const completed = await this.appointmentsRepository.count({
      where: {
        appointmentTime: Between(start, end),
        status: AppointmentStatus.COMPLETED,
      },
    });

    const cancelled = await this.appointmentsRepository.count({
      where: {
        appointmentTime: Between(start, end),
        status: AppointmentStatus.CANCELLED,
      },
    });

    const noShow = await this.appointmentsRepository.count({
      where: {
        appointmentTime: Between(start, end),
        status: AppointmentStatus.NO_SHOW,
      },
    });

    const checkedIn = await this.appointmentsRepository.count({
      where: {
        appointmentTime: Between(start, end),
        status: AppointmentStatus.CHECKED_IN,
      },
    });

    return {
      total,
      completed,
      cancelled,
      noShow,
      checkedIn,
      noShowRate: total > 0 ? (noShow / total) * 100 : 0,
    };
  }

  async getCounselorWorkload(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const appointments = await this.appointmentsRepository.find({
      where: {
        appointmentTime: Between(start, end),
        status: In([
          AppointmentStatus.COMPLETED,
          AppointmentStatus.CHECKED_IN,
          AppointmentStatus.CONFIRMED,
        ]),
      },
      relations: ['counselor'],
    });

    const workloadMap = new Map<string, { counselorId: string; counselorName: string; count: number; totalMinutes: number }>();

    for (const apt of appointments) {
      const counselorId = apt.counselorId;
      if (!workloadMap.has(counselorId)) {
        workloadMap.set(counselorId, {
          counselorId,
          counselorName: apt.counselor?.name || '未知',
          count: 0,
          totalMinutes: 0,
        });
      }
      const entry = workloadMap.get(counselorId)!;
      entry.count++;
      if (apt.package?.durationMinutes) {
        entry.totalMinutes += apt.package.durationMinutes;
      }
    }

    return Array.from(workloadMap.values()).sort((a, b) => b.count - a.count);
  }
}
