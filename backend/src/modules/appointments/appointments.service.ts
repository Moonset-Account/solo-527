import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment, AppointmentStatus, ReviewRating, BadReviewReason } from '../../entities/appointment.entity';
import { OperationLog, OperationType } from '../../entities/operation-log.entity';
import { User } from '../../entities/user.entity';

export interface CreateAppointmentDto {
  startTime: Date;
  endTime: Date;
  petId: string;
  customerId: string;
  staffId?: string;
  serviceId: string;
  totalPrice: number;
  notes?: string;
}

export interface UpdateAppointmentDto {
  startTime?: Date;
  endTime?: Date;
  petId?: string;
  customerId?: string;
  staffId?: string;
  serviceId?: string;
  totalPrice?: number;
  notes?: string;
}

export interface QueryAppointmentsDto {
  page?: number;
  pageSize?: number;
  status?: AppointmentStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  staffId?: string;
  customerId?: string;
  petId?: string;
}

export interface UpdateStatusDto {
  status: AppointmentStatus;
}

export interface ReviewAppointmentDto {
  reviewRating: ReviewRating;
  reviewComment?: string;
  badReviewReason?: BadReviewReason;
}

const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.PENDING]: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.CONFIRMED]: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.NO_SHOW]: [],
};

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(OperationLog)
    private operationLogsRepository: Repository<OperationLog>,
  ) {}

  private async logOperation(
    operator: User,
    operationType: OperationType,
    targetId: string,
    description: string,
    beforeData?: any,
    afterData?: any,
  ) {
    await this.operationLogsRepository.save({
      operatorId: operator.id,
      module: 'appointments',
      operationType,
      targetId,
      description,
      beforeData: beforeData as any,
      afterData: afterData as any,
    });
  }

  async findAll(query: QueryAppointmentsDto) {
    const { page = 1, pageSize = 10, status, date, startDate, endDate, staffId, customerId, petId } = query;
    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (staffId) {
      where.staffId = staffId;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (petId) {
      where.petId = petId;
    }
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.startTime = Between(dayStart, dayEnd);
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.startTime = Between(start, end);
    }

    const [data, total] = await this.appointmentsRepository.findAndCount({
      where,
      relations: ['pet', 'customer', 'staff', 'service'],
      order: { startTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string) {
    const appointment = await this.appointmentsRepository.findOne({
      where: { id },
      relations: ['pet', 'customer', 'staff', 'service'],
    });
    if (!appointment) {
      throw new NotFoundException('预约不存在');
    }
    return appointment;
  }

  async create(dto: CreateAppointmentDto, operator: User) {
    const appointment = this.appointmentsRepository.create({
      ...dto,
      status: AppointmentStatus.PENDING,
    });
    const saved = await this.appointmentsRepository.save(appointment);

    await this.logOperation(
      operator,
      OperationType.CREATE,
      saved.id,
      `创建预约: ${saved.id}`,
      undefined,
      { id: saved.id, startTime: saved.startTime, status: saved.status },
    );

    return this.findOne(saved.id);
  }

  async update(id: string, dto: UpdateAppointmentDto, operator: User) {
    const appointment = await this.findOne(id);
    const beforeData = {
      id: appointment.id,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      staffId: appointment.staffId,
      status: appointment.status,
    };

    await this.appointmentsRepository.update(id, dto);
    const updated = await this.findOne(id);

    await this.logOperation(
      operator,
      OperationType.UPDATE,
      id,
      `更新预约: ${id}`,
      beforeData,
      { id: updated.id, startTime: updated.startTime, endTime: updated.endTime, staffId: updated.staffId },
    );

    return updated;
  }

  async updateStatus(id: string, dto: UpdateStatusDto, operator: User) {
    const appointment = await this.findOne(id);
    const allowedTransitions = STATUS_TRANSITIONS[appointment.status];

    if (!allowedTransitions.includes(dto.status)) {
      throw new BadRequestException(`无法从 ${appointment.status} 状态变更为 ${dto.status}`);
    }

    const beforeData = { id: appointment.id, status: appointment.status };
    const updateData: any = { status: dto.status };

    if (dto.status === AppointmentStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    await this.appointmentsRepository.update(id, updateData);
    const updated = await this.findOne(id);

    let operationType = OperationType.OTHER;
    if (dto.status === AppointmentStatus.CANCELLED) {
      operationType = OperationType.CANCEL;
    } else if (dto.status === AppointmentStatus.COMPLETED) {
      operationType = OperationType.COMPLETE;
    }

    await this.logOperation(
      operator,
      operationType,
      id,
      `预约状态变更: ${appointment.status} -> ${dto.status}`,
      beforeData,
      { id: updated.id, status: updated.status },
    );

    return updated;
  }

  async review(id: string, dto: ReviewAppointmentDto, operator: User) {
    const appointment = await this.findOne(id);

    if (appointment.status !== AppointmentStatus.COMPLETED) {
      throw new BadRequestException('只能对已完成的预约进行评价');
    }

    const beforeData = {
      id: appointment.id,
      reviewRating: appointment.reviewRating,
      reviewComment: appointment.reviewComment,
      badReviewReason: appointment.badReviewReason,
    };

    await this.appointmentsRepository.update(id, dto);
    const updated = await this.findOne(id);

    await this.logOperation(
      operator,
      OperationType.UPDATE,
      id,
      `预约评价: ${id}, 评分: ${dto.reviewRating}`,
      beforeData,
      {
        id: updated.id,
        reviewRating: updated.reviewRating,
        reviewComment: updated.reviewComment,
        badReviewReason: updated.badReviewReason,
      },
    );

    return updated;
  }

  async remove(id: string, operator: User) {
    const appointment = await this.findOne(id);
    await this.appointmentsRepository.delete(id);

    await this.logOperation(
      operator,
      OperationType.DELETE,
      id,
      `删除预约: ${id}`,
      { id: appointment.id, startTime: appointment.startTime, status: appointment.status },
      undefined,
    );

    return { success: true };
  }
}
