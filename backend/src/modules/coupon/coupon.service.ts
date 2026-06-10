import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Coupon, CouponDocument } from './coupon.schema';
import { CouponStatus, CouponType } from '../../common/enums';
import { DEFAULT_MEMBERS } from '../../common/constants/default-members';

@Injectable()
export class CouponService {
  constructor(@InjectModel(Coupon.name) private couponModel: Model<CouponDocument>) {
    this.initDefaultData();
  }

  async initDefaultData() {
    const count = await this.couponModel.countDocuments();
    if (count === 0) {
      const now = new Date();
      const coupons = [
        { couponNo: 'CP20240001', name: '复购满200减50券', type: CouponType.REPURCHASE, value: 50, threshold: 200, status: CouponStatus.UNUSED },
        { couponNo: 'CP20240002', name: '复购满300减80券', type: CouponType.REPURCHASE, value: 80, threshold: 300, status: CouponStatus.UNUSED },
        { couponNo: 'CP20240003', name: '9折折扣券', type: CouponType.DISCOUNT, value: 90, status: CouponStatus.USED, usedTime: new Date(now.getTime() - 5 * 24 * 3600 * 1000) },
        { couponNo: 'CP20240004', name: '复购满100减20券', type: CouponType.REPURCHASE, value: 20, threshold: 100, status: CouponStatus.EXPIRED },
        { couponNo: 'CP20240005', name: '50元现金券', type: CouponType.CASH, value: 50, status: CouponStatus.UNUSED },
        { couponNo: 'CP20240006', name: '复购满500减150券', type: CouponType.REPURCHASE, value: 150, threshold: 500, status: CouponStatus.UNUSED },
        { couponNo: 'CP20240007', name: '85折折扣券', type: CouponType.DISCOUNT, value: 85, status: CouponStatus.UNUSED },
        { couponNo: 'CP20240008', name: '复购满150减30券', type: CouponType.REPURCHASE, value: 30, threshold: 150, status: CouponStatus.USED, usedTime: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
      ];

      const persons = ['小王', '小李', '小张', '小陈'];

      for (let i = 0; i < coupons.length; i++) {
        const member = DEFAULT_MEMBERS[i % DEFAULT_MEMBERS.length];
        const validFrom = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 3600 * 1000);
        const validTo = new Date(now.getTime() + (30 + Math.floor(Math.random() * 60)) * 24 * 3600 * 1000);
        await this.couponModel.create({
          ...coupons[i],
          memberId: new Types.ObjectId(member._id),
          memberName: member.name,
          memberPhone: member.phone,
          validFrom,
          validTo,
          storeId: 'store001',
          storeName: '青禾美妆-南京路店',
          responsiblePerson: persons[Math.floor(Math.random() * persons.length)],
          responsiblePersonId: 'op' + Math.floor(Math.random() * 10),
          remark: '',
        });
      }
      console.log('✅ 默认优惠券数据已创建');
    }
  }

  async findAll(params: any = {}) {
    const { page = 1, pageSize = 20, keyword, type, status, startDate, endDate, responsiblePerson, storeId, memberId } = params;
    const query: any = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { memberName: { $regex: keyword, $options: 'i' } },
        { memberPhone: { $regex: keyword } },
        { couponNo: { $regex: keyword } },
      ];
    }
    if (type) query.type = type;
    if (status) query.status = status;
    if (memberId) query.memberId = new Types.ObjectId(memberId);
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate + 'T23:59:59');
    }
    if (responsiblePerson) query.responsiblePerson = { $regex: responsiblePerson, $options: 'i' };
    if (storeId) query.storeId = storeId;

    const [list, total] = await Promise.all([
      this.couponModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * pageSize).limit(pageSize),
      this.couponModel.countDocuments(query),
    ]);
    return { list, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async findById(id: string) {
    return this.couponModel.findById(id);
  }

  async findByMemberId(memberId: string) {
    return this.couponModel.find({ memberId }).sort({ createdAt: -1 });
  }

  async create(data: Partial<Coupon>) {
    return this.couponModel.create(data);
  }

  async update(id: string, data: Partial<Coupon>) {
    return this.couponModel.findByIdAndUpdate(id, data, { new: true });
  }

  async useCoupon(id: string, orderNo: string) {
    return this.couponModel.findByIdAndUpdate(
      id,
      { status: CouponStatus.USED, usedTime: new Date(), usedOrderNo: orderNo },
      { new: true },
    );
  }

  async getStats() {
    const total = await this.couponModel.countDocuments();
    const byStatus = await this.couponModel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    return { total, byStatus };
  }
}
