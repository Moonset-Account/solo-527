import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CheckIn } from './checkin.entity';
import { AppointmentsService } from '../appointments/appointments.service';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { DateUtils } from '../../common/utils/date.utils';
import { OperationLogService } from '../../common/services/operation-log.service';

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn)
    private checkinRepository: Repository<CheckIn>,
    private appointmentsService: AppointmentsService,
    private operationLogService: OperationLogService,
  ) {}

  findAll(
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: CheckIn[]; total: number }> {
    const where: any = {};
    if (startDate && endDate) {
      where.checkinTime = Between(new Date(startDate), new Date(endDate));
    }

    return this.checkinRepository.findAndCount({
      where,
      relations: ['appointment', 'appointment.counselor'],
      order: { checkinTime: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    }).then(([data, total]) => ({ data, total }));
  }

  findOne(id: string): Promise<CheckIn | null> {
    return this.checkinRepository.findOne({
      where: { id },
      relations: ['appointment', 'appointment.counselor'],
    });
  }

  async checkIn(
    appointmentId: string,
    operatorId: string,
    operatorName: string,
    notes?: string,
    ipAddress?: string,
  ): Promise<CheckIn> {
    const appointment = await this.appointmentsService.findOne(appointmentId);
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }

    if (appointment.status === AppointmentStatus.CHECKED_IN) {
      throw new BadRequestException('该预约已核销');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('该预约已取消');
    }

    await this.appointmentsService.updateStatus(
      appointmentId,
      AppointmentStatus.CHECKED_IN,
      operatorId,
      operatorName,
      ipAddress,
    );

    const checkin = this.checkinRepository.create({
      appointmentId,
      checkinTime: new Date(),
      operatorId,
      operatorName,
      notes,
    });

    const result = await this.checkinRepository.save(checkin);

    this.operationLogService.log(
      operatorId,
      operatorName,
      'checkin',
      'appointment',
      appointmentId,
      { notes: notes || '' },
      ipAddress,
    );

    return result;
  }

  async getTodayCheckins(): Promise<CheckIn[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.checkinRepository
      .createQueryBuilder('checkin')
      .leftJoinAndSelect('checkin.appointment', 'appointment')
      .leftJoinAndSelect('appointment.counselor', 'counselor')
      .where('checkin.checkinTime >= :today', { today })
      .andWhere('checkin.checkinTime < :tomorrow', { tomorrow })
      .orderBy('checkin.checkinTime', 'DESC')
      .getMany();
  }
}
