import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';
import {
  Appointment,
  AppointmentDocument,
  AppointmentStatus,
  AppointmentService,
} from './appointment.schema';
import { ServicesService } from '../services/services.service';
import { TechniciansService } from '../technicians/technicians.service';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel('Appointment') private appointmentModel: Model<AppointmentDocument>,
    private servicesService: ServicesService,
    private techniciansService: TechniciansService,
  ) {}

  async create(createAppointmentDto: any, userId: string): Promise<Appointment> {
    const { technicianId, serviceIds, appointmentDate, startTime, customerId, customerName, customerPhone, remark } = createAppointmentDto;

    const services = [];
    let totalPrice = 0;
    let totalDuration = 0;

    for (const serviceId of serviceIds) {
      const service = await this.servicesService.findById(serviceId);
      if (!service) {
        throw new NotFoundException(`服务项目不存在: ${serviceId}`);
      }
      services.push({
        serviceId,
        serviceName: service.name,
        price: service.price,
        duration: service.duration || 60,
      });
      totalPrice += service.price;
      totalDuration += service.duration || 60;
    }

    const technician = await this.techniciansService.findById(technicianId);
    if (!technician) {
      throw new NotFoundException('技师不存在');
    }

    const hasConflict = await this.checkConflict(technicianId, appointmentDate, startTime, totalDuration);
    if (hasConflict) {
      throw new BadRequestException('该时间段已有预约，请选择其他时间');
    }

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + totalDuration;
    const endTime = this.minutesToTime(endMinutes);

    const appointment = new this.appointmentModel({
      customerId,
      customerName,
      customerPhone,
      technicianId,
      technicianName: technician.name,
      services,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      totalPrice,
      totalDuration,
      remark,
      status: AppointmentStatus.PENDING,
      createdBy: userId,
      updatedBy: userId,
      source: 'system',
    });

    return appointment.save();
  }

  async findAll(query: any = {}): Promise<Appointment[]> {
    const filter: any = {};
    
    if (query.status) {
      filter.status = query.status;
    }
    if (query.technicianId) {
      filter.technicianId = query.technicianId;
    }
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.startDate && query.endDate) {
      filter.appointmentDate = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }
    if (query.date) {
      const date = dayjs(query.date).startOf('day').toDate();
      const nextDate = dayjs(query.date).add(1, 'day').startOf('day').toDate();
      filter.appointmentDate = {
        $gte: date,
        $lt: nextDate,
      };
    }

    return this.appointmentModel.find(filter).sort({ appointmentDate: -1, startTime: 1 }).exec();
  }

  async findById(id: string): Promise<Appointment | null> {
    return this.appointmentModel.findById(id).exec();
  }

  async update(id: string, updateAppointmentDto: any, userId: string): Promise<Appointment | null> {
    updateAppointmentDto.updatedBy = userId;
    
    if (updateAppointmentDto.startTime || updateAppointmentDto.appointmentDate || updateAppointmentDto.technicianId) {
      const existing = await this.appointmentModel.findById(id);
      if (!existing) {
        throw new NotFoundException('预约不存在');
      }

      const technicianId = updateAppointmentDto.technicianId || existing.technicianId;
      const appointmentDate = updateAppointmentDto.appointmentDate || existing.appointmentDate;
      const startTime = updateAppointmentDto.startTime || existing.startTime;

      const hasConflict = await this.checkConflict(
        technicianId,
        appointmentDate,
        startTime,
        existing.totalDuration,
        id,
      );
      if (hasConflict) {
        throw new BadRequestException('该时间段已有预约，请选择其他时间');
      }

      if (updateAppointmentDto.startTime) {
        const startMinutes = this.timeToMinutes(startTime);
        const endMinutes = startMinutes + existing.totalDuration;
        updateAppointmentDto.endTime = this.minutesToTime(endMinutes);
      }
      if (updateAppointmentDto.appointmentDate) {
        updateAppointmentDto.appointmentDate = new Date(updateAppointmentDto.appointmentDate);
      }
    }

    return this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .exec();
  }

  async reschedule(id: string, rescheduleDto: { appointmentDate: string; startTime: string }, userId: string): Promise<Appointment | null> {
    const existing = await this.appointmentModel.findById(id);
    if (!existing) {
      throw new NotFoundException('预约不存在');
    }

    const hasConflict = await this.checkConflict(
      existing.technicianId,
      rescheduleDto.appointmentDate,
      rescheduleDto.startTime,
      existing.totalDuration,
      id,
    );
    if (hasConflict) {
      throw new BadRequestException('该时间段已有预约，请选择其他时间');
    }

    const startMinutes = this.timeToMinutes(rescheduleDto.startTime);
    const endMinutes = startMinutes + existing.totalDuration;
    const endTime = this.minutesToTime(endMinutes);

    return this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          appointmentDate: new Date(rescheduleDto.appointmentDate),
          startTime: rescheduleDto.startTime,
          endTime,
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();
  }

  async cancel(id: string, userId: string): Promise<Appointment | null> {
    return this.appointmentModel
      .findByIdAndUpdate(
        id,
        { status: AppointmentStatus.CANCELLED, updatedBy: userId },
        { new: true },
      )
      .exec();
  }

  async checkIn(id: string, userId: string): Promise<Appointment | null> {
    return this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          status: AppointmentStatus.CHECKED_IN,
          checkedInAt: new Date(),
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();
  }

  async complete(id: string, userId: string): Promise<Appointment | null> {
    return this.appointmentModel
      .findByIdAndUpdate(
        id,
        {
          status: AppointmentStatus.COMPLETED,
          completedAt: new Date(),
          updatedBy: userId,
        },
        { new: true },
      )
      .exec();
  }

  async remove(id: string): Promise<Appointment | null> {
    return this.appointmentModel.findByIdAndDelete(id).exec();
  }

  async checkConflict(
    technicianId: string,
    appointmentDate: string | Date,
    startTime: string,
    duration: number,
    excludeId?: string,
  ): Promise<boolean> {
    const date = dayjs(appointmentDate).startOf('day').toDate();
    const nextDate = dayjs(appointmentDate).add(1, 'day').startOf('day').toDate();

    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = startMinutes + duration;

    const filter: any = {
      technicianId,
      appointmentDate: { $gte: date, $lt: nextDate },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN] },
    };

    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const appointments = await this.appointmentModel.find(filter).exec();

    for (const appt of appointments) {
      const apptStart = this.timeToMinutes(appt.startTime);
      const apptEnd = apptStart + appt.totalDuration;

      if (startMinutes < apptEnd && endMinutes > apptStart) {
        return true;
      }
    }

    return false;
  }

  async getAvailableTimeSlots(technicianId: string, date: string, serviceDuration: number): Promise<string[]> {
    const technician = await this.techniciansService.findById(technicianId);
    if (!technician) {
      throw new NotFoundException('技师不存在');
    }

    const workStart = this.timeToMinutes(technician.workStartTime || '09:00');
    const workEnd = this.timeToMinutes(technician.workEndTime || '18:00');

    const existingAppointments = await this.appointmentModel.find({
      technicianId,
      appointmentDate: {
        $gte: dayjs(date).startOf('day').toDate(),
        $lt: dayjs(date).add(1, 'day').startOf('day').toDate(),
      },
      status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN] },
    }).exec();

    const availableSlots: string[] = [];
    const interval = 30;

    for (let time = workStart; time + serviceDuration <= workEnd; time += interval) {
      let hasConflict = false;
      const slotEnd = time + serviceDuration;

      for (const appt of existingAppointments) {
        const apptStart = this.timeToMinutes(appt.startTime);
        const apptEnd = apptStart + appt.totalDuration;

        if (time < apptEnd && slotEnd > apptStart) {
          hasConflict = true;
          break;
        }
      }

      if (!hasConflict) {
        availableSlots.push(this.minutesToTime(time));
      }
    }

    return availableSlots;
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  async getTodayCount(): Promise<number> {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();
    return this.appointmentModel.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $ne: AppointmentStatus.CANCELLED },
    }).exec();
  }
}
