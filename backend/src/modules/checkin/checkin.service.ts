import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CheckinRecord,
  CheckinRecordDocument,
  CheckinStatus,
} from './checkin.schema';
import { AppointmentsService } from '../appointments/appointments.service';
import { MembershipsService } from '../memberships/memberships.service';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel('CheckinRecord') private checkinModel: Model<CheckinRecordDocument>,
    private appointmentsService: AppointmentsService,
    private membershipsService: MembershipsService,
  ) {}

  async createFromAppointment(appointment: any, userId: string, userName: string): Promise<CheckinRecordDocument> {
    const appointmentId = typeof appointment._id === 'object' ? appointment._id.toString() : appointment._id;

    const existing = await this.checkinModel.findOne({
      appointmentId,
      status: { $in: [CheckinStatus.PENDING, CheckinStatus.CHECKED_IN] },
    }).exec();

    if (existing) {
      throw new BadRequestException('该预约已存在核销记录');
    }

    const checkinRecord = new this.checkinModel({
      appointmentId,
      customerId: appointment.customerId,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      technicianId: appointment.technicianId,
      technicianName: appointment.technicianName,
      services: appointment.services,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.startTime,
      totalAmount: appointment.totalPrice,
      actualAmount: appointment.totalPrice,
      status: CheckinStatus.CHECKED_IN,
      checkinTime: new Date(),
      checkedInBy: userId,
    });

    const saved = await checkinRecord.save();

    await this.appointmentsService.checkIn(appointmentId, userId);

    return saved;
  }

  async findAll(query: any = {}): Promise<CheckinRecordDocument[]> {
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
      const start = new Date(query.date);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      filter.appointmentDate = { $gte: start, $lt: end };
    }

    return this.checkinModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<CheckinRecordDocument | null> {
    return this.checkinModel.findById(id).exec();
  }

  async findByAppointmentId(appointmentId: string): Promise<CheckinRecordDocument | null> {
    return this.checkinModel.findOne({ appointmentId }).exec();
  }

  async checkin(id: string, userId: string): Promise<CheckinRecordDocument | null> {
    const record = await this.checkinModel.findById(id);
    if (!record) {
      throw new NotFoundException('核销记录不存在');
    }

    if (record.status !== CheckinStatus.PENDING) {
      throw new BadRequestException('当前状态不可签到');
    }

    record.status = CheckinStatus.CHECKED_IN;
    record.checkinTime = new Date();
    record.checkedInBy = userId;

    const saved = await record.save();

    await this.appointmentsService.checkIn(record.appointmentId, userId);

    return saved;
  }

  async complete(
    id: string,
    completeData: {
      actualAmount: number;
      discountAmount?: number;
      customerMembershipId?: string;
      membershipDeduction?: number;
      paymentMethod: string;
      remark?: string;
    },
    userId: string,
    userName: string,
  ): Promise<CheckinRecordDocument | null> {
    const record = await this.checkinModel.findById(id);
    if (!record) {
      throw new NotFoundException('核销记录不存在');
    }

    if (record.status !== CheckinStatus.CHECKED_IN) {
      throw new BadRequestException('当前状态不可完成');
    }

    if (completeData.paymentMethod === 'membership') {
      if (!completeData.customerMembershipId) {
        throw new BadRequestException('支付方式为会员卡时必须选择顾客会员卡');
      }
      if (!completeData.membershipDeduction || completeData.membershipDeduction <= 0) {
        throw new BadRequestException('支付方式为会员卡时必须输入正数抵扣值');
      }

      const customerMembership = await this.membershipsService.findCustomerMembershipById(completeData.customerMembershipId);
      if (!customerMembership) {
        throw new NotFoundException('顾客会员卡不存在');
      }

      if (customerMembership.remainingTimes != null) {
        if (customerMembership.remainingTimes < 1) {
          throw new BadRequestException('会员卡剩余次数不足');
        }
        await this.membershipsService.useMembership(completeData.customerMembershipId, 1);
      } else if (customerMembership.remainingAmount != null) {
        if (customerMembership.remainingAmount < completeData.membershipDeduction) {
          throw new BadRequestException('会员卡剩余金额不足');
        }
        await this.membershipsService.useMembership(completeData.customerMembershipId, undefined, completeData.membershipDeduction);
      } else {
        throw new BadRequestException('会员卡数据异常，请联系管理员');
      }
    } else if (completeData.customerMembershipId && completeData.membershipDeduction && completeData.membershipDeduction > 0) {
      const customerMembership = await this.membershipsService.findCustomerMembershipById(completeData.customerMembershipId);
      if (!customerMembership) {
        throw new NotFoundException('顾客会员卡不存在');
      }

      if (customerMembership.remainingTimes != null) {
        if (customerMembership.remainingTimes < 1) {
          throw new BadRequestException('会员卡剩余次数不足');
        }
        await this.membershipsService.useMembership(completeData.customerMembershipId, 1);
      } else if (customerMembership.remainingAmount != null) {
        if (customerMembership.remainingAmount < completeData.membershipDeduction) {
          throw new BadRequestException('会员卡剩余金额不足');
        }
        await this.membershipsService.useMembership(completeData.customerMembershipId, undefined, completeData.membershipDeduction);
      }
    }

    record.status = CheckinStatus.COMPLETED;
    record.checkoutTime = new Date();
    record.actualAmount = completeData.actualAmount;
    record.discountAmount = completeData.discountAmount;
    record.membershipId = completeData.customerMembershipId;
    record.membershipDeduction = completeData.membershipDeduction;
    record.paymentMethod = completeData.paymentMethod;
    record.remark = completeData.remark;
    record.completedBy = userId;
    record.cashierId = userId;
    record.cashierName = userName;

    const saved = await record.save();

    await this.appointmentsService.complete(record.appointmentId, userId);

    return saved;
  }

  async cancel(id: string, userId: string): Promise<CheckinRecordDocument | null> {
    const record = await this.checkinModel.findById(id);
    if (!record) {
      throw new NotFoundException('核销记录不存在');
    }

    record.status = CheckinStatus.CANCELLED;
    record.checkedInBy = userId;

    return record.save();
  }

  async getTodayCheckinCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.checkinModel.countDocuments({
      appointmentDate: { $gte: today, $lt: tomorrow },
      status: { $ne: CheckinStatus.CANCELLED },
    }).exec();
  }

  async getTodayStats(): Promise<{
    total: number;
    checkedIn: number;
    completed: number;
    totalAmount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await this.checkinModel.find({
      appointmentDate: { $gte: today, $lt: tomorrow },
    }).exec();

    let checkedIn = 0;
    let completed = 0;
    let totalAmount = 0;

    for (const record of records) {
      if (record.status === CheckinStatus.CHECKED_IN) {
        checkedIn++;
      }
      if (record.status === CheckinStatus.COMPLETED) {
        completed++;
        totalAmount += record.actualAmount;
      }
    }

    return {
      total: records.length,
      checkedIn,
      completed,
      totalAmount,
    };
  }
}
