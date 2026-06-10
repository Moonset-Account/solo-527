import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';
import { Membership, MembershipDocument, MembershipStatus, MembershipType } from './membership.schema';
import {
  CustomerMembership,
  CustomerMembershipDocument,
  CustomerMembershipStatus,
} from './customer-membership.schema';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectModel('Membership') private membershipModel: Model<MembershipDocument>,
    @InjectModel('CustomerMembership') private customerMembershipModel: Model<CustomerMembershipDocument>,
  ) {}

  async create(createMembershipDto: Partial<Membership>): Promise<Membership> {
    const membership = new this.membershipModel(createMembershipDto);
    return membership.save();
  }

  async findAll(query: any = {}): Promise<Membership[]> {
    const filter: any = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.type) {
      filter.type = query.type;
    }
    return this.membershipModel.find(filter).sort({ sort: 1, createdAt: -1 }).exec();
  }

  async findActive(): Promise<Membership[]> {
    return this.membershipModel.find({ status: MembershipStatus.ACTIVE }).sort({ sort: 1 }).exec();
  }

  async findById(id: string): Promise<Membership | null> {
    return this.membershipModel.findById(id).exec();
  }

  async update(id: string, updateMembershipDto: Partial<Membership>): Promise<Membership | null> {
    return this.membershipModel
      .findByIdAndUpdate(id, updateMembershipDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Membership | null> {
    return this.membershipModel.findByIdAndDelete(id).exec();
  }

  async sellMembership(sellDto: any, userId: string): Promise<CustomerMembership> {
    const { membershipId, customerId, customerName } = sellDto;

    const membership = await this.membershipModel.findById(membershipId);
    if (!membership) {
      throw new NotFoundException('会员卡不存在');
    }

    const customerMembership = new this.customerMembershipModel({
      customerId,
      customerName,
      membershipId,
      membershipName: membership.name,
      purchasePrice: membership.price,
      remainingTimes: membership.totalTimes,
      remainingAmount: membership.totalAmount,
      expireDate: membership.durationDays
        ? dayjs().add(membership.durationDays, 'day').toDate()
        : null,
      status: CustomerMembershipStatus.ACTIVE,
      createdBy: userId,
      remark: sellDto.remark,
    });

    return customerMembership.save();
  }

  async getCustomerMemberships(customerId: string): Promise<CustomerMembership[]> {
    return this.customerMembershipModel
      .find({ customerId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async useMembership(id: string, times?: number, amount?: number): Promise<CustomerMembership | null> {
    const customerMembership = await this.customerMembershipModel.findById(id);
    if (!customerMembership) {
      throw new NotFoundException('顾客会员卡不存在');
    }

    if (customerMembership.status !== CustomerMembershipStatus.ACTIVE) {
      throw new BadRequestException('会员卡状态不可用');
    }

    if (customerMembership.expireDate && dayjs(customerMembership.expireDate).isBefore(dayjs())) {
      customerMembership.status = CustomerMembershipStatus.EXPIRED;
      await customerMembership.save();
      throw new BadRequestException('会员卡已过期');
    }

    if (times !== undefined) {
      if ((customerMembership.remainingTimes || 0) < times) {
        throw new BadRequestException('次数不足');
      }
      customerMembership.remainingTimes = (customerMembership.remainingTimes || 0) - times;
      if (customerMembership.remainingTimes <= 0) {
        customerMembership.status = CustomerMembershipStatus.USED_UP;
      }
    }

    if (amount !== undefined) {
      if ((customerMembership.remainingAmount || 0) < amount) {
        throw new BadRequestException('余额不足');
      }
      customerMembership.remainingAmount = (customerMembership.remainingAmount || 0) - amount;
      if (customerMembership.remainingAmount <= 0) {
        customerMembership.status = CustomerMembershipStatus.USED_UP;
      }
    }

    return customerMembership.save();
  }

  async findCustomerMembershipById(id: string): Promise<CustomerMembership | null> {
    return this.customerMembershipModel.findById(id).exec();
  }

  async getAllCustomerMemberships(query: any = {}): Promise<CustomerMembership[]> {
    const filter: any = {};
    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.status) {
      filter.status = query.status;
    }
    return this.customerMembershipModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }
}
