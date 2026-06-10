import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CashierRecord, CashierRecordDocument, CashierType } from './cashier.schema';

@Injectable()
export class CashierService {
  constructor(@InjectModel('CashierRecord') private cashierModel: Model<CashierRecordDocument>) {}

  async create(createCashierDto: any, userId: string, userName: string): Promise<CashierRecord> {
    const orderNo = this.generateOrderNo();
    
    const record = new this.cashierModel({
      ...createCashierDto,
      orderNo,
      cashierId: userId,
      cashierName: userName,
      refunded: false,
    });

    return record.save();
  }

  async findAll(query: any = {}): Promise<CashierRecord[]> {
    const filter: any = {};
    
    if (query.type) {
      filter.type = query.type;
    }
    if (query.paymentMethod) {
      filter.paymentMethod = query.paymentMethod;
    }
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.startDate && query.endDate) {
      filter.createdAt = {
        $gte: new Date(query.startDate),
        $lte: new Date(query.endDate),
      };
    }

    return this.cashierModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findById(id: string): Promise<CashierRecord | null> {
    return this.cashierModel.findById(id).exec();
  }

  async findByOrderNo(orderNo: string): Promise<CashierRecord | null> {
    return this.cashierModel.findOne({ orderNo }).exec();
  }

  async refund(id: string, refundAmount: number, userId: string): Promise<CashierRecord | null> {
    const record = await this.cashierModel.findById(id);
    if (!record) {
      throw new NotFoundException('收银记录不存在');
    }

    record.refunded = true;
    record.refundAmount = refundAmount;
    record.refundAt = new Date();
    record.refundBy = userId;

    return record.save();
  }

  async getDailyStats(date: string): Promise<{
    totalAmount: number;
    totalCount: number;
    byType: Record<string, { amount: number; count: number }>;
    byPaymentMethod: Record<string, { amount: number; count: number }>;
  }> {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);

    const records = await this.cashierModel.find({
      createdAt: { $gte: startDate, $lt: endDate },
      refunded: false,
    }).exec();

    let totalAmount = 0;
    const byType: Record<string, { amount: number; count: number }> = {};
    const byPaymentMethod: Record<string, { amount: number; count: number }> = {};

    for (const record of records) {
      totalAmount += record.actualAmount;

      if (!byType[record.type]) {
        byType[record.type] = { amount: 0, count: 0 };
      }
      byType[record.type].amount += record.actualAmount;
      byType[record.type].count += 1;

      if (!byPaymentMethod[record.paymentMethod]) {
        byPaymentMethod[record.paymentMethod] = { amount: 0, count: 0 };
      }
      byPaymentMethod[record.paymentMethod].amount += record.actualAmount;
      byPaymentMethod[record.paymentMethod].count += 1;
    }

    return {
      totalAmount,
      totalCount: records.length,
      byType,
      byPaymentMethod,
    };
  }

  private generateOrderNo(): string {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `SK${dateStr}${random}`;
  }
}
