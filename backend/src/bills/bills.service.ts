import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bill, BillStatus } from './bill.schema';
import { CreateBillDto, UpdateBillDto, PaymentRecordDto } from './dto/bill.dto';

function generateBillNo(): string {
  const date = new Date();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BL${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${rand}`;
}

@Injectable()
export class BillsService {
  constructor(@InjectModel(Bill.name) private billModel: Model<Bill>) {}

  async create(dto: CreateBillDto, createdBy: Types.ObjectId): Promise<Bill> {
    const bill = new this.billModel({
      ...dto,
      billNo: generateBillNo(),
      unpaidAmount: dto.totalAmount,
      paidAmount: 0,
      createdBy,
      updatedBy: createdBy,
    });
    return bill.save();
  }

  async createBatch(dtos: CreateBillDto[], createdBy: Types.ObjectId): Promise<Bill[]> {
    const bills = dtos.map(dto => new this.billModel({
      ...dto,
      billNo: generateBillNo(),
      unpaidAmount: dto.totalAmount,
      paidAmount: 0,
      createdBy,
      updatedBy: createdBy,
    }));
    return this.billModel.insertMany(bills);
  }

  async findAll(query: {
    page?: number; limit?: number; status?: string; type?: string;
    roomNo?: string; billingPeriod?: string;
  } = {}): Promise<{ data: Bill[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;
    if (query.roomNo) filter.roomNo = { $regex: query.roomNo, $options: 'i' };
    if (query.billingPeriod) filter.billingPeriod = { $regex: query.billingPeriod };

    const [data, total] = await Promise.all([
      this.billModel.find(filter).skip(skip).limit(limit)
        .populate('createdBy', 'realName username')
        .populate('updatedBy', 'realName username')
        .populate('paymentRecords.paidBy', 'realName username')
        .sort({ createdAt: -1 }).exec(),
      this.billModel.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billModel.findById(id)
      .populate('createdBy', 'realName username')
      .populate('updatedBy', 'realName username')
      .populate('paymentRecords.paidBy', 'realName username');
    if (!bill) throw new NotFoundException('账单不存在');
    return bill;
  }

  async update(id: string, dto: UpdateBillDto, updatedBy: Types.ObjectId): Promise<Bill> {
    const bill = await this.billModel.findByIdAndUpdate(id, { ...dto, updatedBy }, { new: true });
    if (!bill) throw new NotFoundException('账单不存在');
    return bill;
  }

  async pay(id: string, dto: PaymentRecordDto, paidBy: Types.ObjectId): Promise<Bill> {
    const bill = await this.billModel.findById(id);
    if (!bill) throw new NotFoundException('账单不存在');
    if (bill.status === BillStatus.CANCELLED) throw new BadRequestException('已取消的账单无法支付');
    if (dto.amount > bill.unpaidAmount) throw new BadRequestException('支付金额超过未付金额');

    bill.paidAmount += dto.amount;
    bill.unpaidAmount -= dto.amount;
    bill.paymentRecords.push({
      date: new Date(),
      amount: dto.amount,
      paidBy,
      method: dto.method,
      remark: dto.remark,
    });
    bill.updatedBy = paidBy;

    if (bill.unpaidAmount <= 0) {
      bill.status = BillStatus.PAID;
      bill.unpaidAmount = 0;
    } else {
      bill.status = BillStatus.PARTIAL;
    }
    return bill.save();
  }

  async getStatistics(): Promise<any> {
    const result = await this.billModel.aggregate([
      {
        $group: {
          _id: null,
          totalBills: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          totalUnpaid: { $sum: '$unpaidAmount' },
          paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
          unpaidCount: { $sum: { $cond: [{ $eq: ['$status', 'unpaid'] }, 1, 0] } },
          partialCount: { $sum: { $cond: [{ $eq: ['$status', 'partial'] }, 1, 0] } },
          overdueCount: { $sum: { $cond: [{ $eq: ['$status', 'overdue'] }, 1, 0] } },
        },
      },
    ]);

    const byPeriod = await this.billModel.aggregate([
      {
        $group: {
          _id: '$billingPeriod',
          total: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' },
          unpaid: { $sum: '$unpaidAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]);

    const byType = await this.billModel.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$totalAmount' },
          paid: { $sum: '$paidAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      summary: result[0] || {
        totalBills: 0, totalAmount: 0, totalPaid: 0, totalUnpaid: 0,
        paidCount: 0, unpaidCount: 0, partialCount: 0, overdueCount: 0,
      },
      byPeriod,
      byType,
    };
  }
}
