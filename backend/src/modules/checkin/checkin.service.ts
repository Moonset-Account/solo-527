import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CheckinRecord,
  CheckinRecordDocument,
  CheckinStatus,
} from './checkin.schema';

@Injectable()
export class CheckinService {
  constructor(
    @InjectModel('CheckinRecord') private checkinModel: Model<CheckinRecordDocument>,
  ) {}

  async createFromAppointment(appointment: any, userId: string, userName: string): Promise<CheckinRecord> {
    const existing = await this.checkinModel.findOne({
      appointmentId: appointment._id,
      status: { $in: [CheckinStatus.PENDING, CheckinStatus.CHECKED_IN] },
    }).exec();

    if (existing) {
      throw new BadRequestException('该预约已存在核销记录');
    }

    const checkinRecord = new this.checkinModel({
      appointmentId: appointment._id,
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
      status: CheckinStatus.PENDING,
      checkedInBy: userId,
    });

    return checkinRecord.save();
  }

  async findAll(query: any = {}): Promise<CheckinRecord[]> {
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

  async findById(id: string): Promise<CheckinRecord | null> {
    return this.checkinModel.findById(id).exec();
  }

  async findByAppointmentId(appointmentId: string): Promise<CheckinRecord | null> {
    return this.checkinModel.findOne({ appointmentId }).exec();
  }

  async checkin(id: string, userId: string): Promise<CheckinRecord | null> {
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

    return record.save();
  }

  async complete(
    id: string,
    completeData: {
      actualAmount: number;
      discountAmount?: number;
      membershipId?: string;
      membershipDeduction?: number;
      paymentMethod: string;
      remark?: string;
    },
    userId: string,
    userName: string,
  ): Promise<CheckinRecord | null> {
    const record = await this.checkinModel.findById(id);
    if (!record) {
      throw new NotFoundException('核销记录不存在');
    }

    if (record.status !== CheckinStatus.CHECKED_IN) {
      throw new BadRequestException('当前状态不可完成');
    }

    record.status = CheckinStatus.COMPLETED;
    record.checkoutTime = new Date();
    record.actualAmount = completeData.actualAmount;
    record.discountAmount = completeData.discountAmount;
    record.membershipId = completeData.membershipId;
    record.membershipDeduction = completeData.membershipDeduction;
    record.paymentMethod = completeData.paymentMethod;
    record.remark = completeData.remark;
    record.completedBy = userId;
    record.cashierId = userId;
    record.cashierName = userName;

    return record.save();
  }

  async cancel(id: string, userId: string): Promise<CheckinRecord | null> {
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
