import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Refund } from '../../schemas/refund.schema';
import { CreateRefundDto, UpdateRefundDto, QueryRefundDto } from './refund.dto';

@Injectable()
export class RefundService {
  constructor(@InjectModel(Refund.name) private refundModel: Model<Refund>) {}

  async create(dto: CreateRefundDto): Promise<Refund> {
    const existing = await this.refundModel.findOne({ registrationId: dto.registrationId, status: { $in: ['pending', 'approved'] } }).exec();
    if (existing) throw new BadRequestException('Refund already exists for this registration');
    const created = new this.refundModel(dto);
    return created.save();
  }

  async findAll(query: QueryRefundDto): Promise<{ data: Refund[]; total: number; page: number; limit: number }> {
    const { activityId, status, userId, page = 1, limit = 10 } = query;
    const filter: any = {};
    if (activityId) filter.activityId = activityId;
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const [data, total] = await Promise.all([
      this.refundModel.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }).exec(),
      this.refundModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Refund> {
    const refund = await this.refundModel.findById(id).exec();
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  async review(id: string, dto: UpdateRefundDto): Promise<Refund> {
    const refund = await this.refundModel.findById(id).exec();
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'pending') throw new BadRequestException('Refund is not in pending status');

    const updateData: any = {
      status: dto.status,
      reviewedBy: dto.reviewedBy,
      reviewedAt: new Date(),
    };
    const updated = await this.refundModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) throw new NotFoundException('Refund not found');
    return updated;
  }

  async process(id: string): Promise<Refund> {
    const refund = await this.refundModel.findById(id).exec();
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'approved') throw new BadRequestException('Refund must be approved before processing');

    const updated = await this.refundModel.findByIdAndUpdate(id, { status: 'processed', processedAt: new Date() }, { new: true }).exec();
    if (!updated) throw new NotFoundException('Refund not found');
    return updated;
  }
}
