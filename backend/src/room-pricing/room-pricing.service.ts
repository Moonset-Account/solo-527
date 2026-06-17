import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RoomPricing } from './room-pricing.schema';
import { CreateRoomPricingDto, UpdateRoomPricingDto } from './dto/room-pricing.dto';
import { ConfigStatus } from '../common/decorators/config-status.enum';

@Injectable()
export class RoomPricingService {
  constructor(@InjectModel(RoomPricing.name) private model: Model<RoomPricing>) {}

  async create(dto: CreateRoomPricingDto, createdBy: Types.ObjectId): Promise<RoomPricing> {
    const existing = await this.model.findOne({ roomNo: dto.roomNo });
    if (existing) throw new ConflictException('房间号已存在');
    const doc = new this.model({ ...dto, createdBy, updatedBy: createdBy });
    return doc.save();
  }

  async findAll(q: any): Promise<{ data: RoomPricing[]; total: number }> {
    const page = q.page || 1, limit = q.limit || 20;
    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.roomType) filter.roomType = q.roomType;
    if (q.configStatus) filter.configStatus = q.configStatus;
    if (q.roomNo) filter.roomNo = { $regex: q.roomNo, $options: 'i' };
    const [data, total] = await Promise.all([
      this.model.find(filter).skip((page - 1) * limit).limit(limit)
        .populate('createdBy updatedBy', 'realName username')
        .sort({ floor: 1, roomNo: 1 }),
      this.model.countDocuments(filter),
    ]);
    return { data, total };
  }

  async findOne(id: string): Promise<RoomPricing> {
    const doc = await this.model.findById(id).populate('createdBy updatedBy', 'realName username');
    if (!doc) throw new NotFoundException('房间不存在');
    return doc;
  }

  async update(id: string, dto: UpdateRoomPricingDto, updatedBy: Types.ObjectId): Promise<RoomPricing> {
    const doc = await this.model.findByIdAndUpdate(id, { ...dto, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('房间不存在');
    return doc;
  }

  async updateConfigStatus(id: string, status: ConfigStatus, updatedBy: Types.ObjectId): Promise<RoomPricing> {
    const doc = await this.model.findByIdAndUpdate(id, { configStatus: status, updatedBy }, { new: true });
    if (!doc) throw new NotFoundException('房间不存在');
    return doc;
  }

  async statistics(): Promise<any> {
    const [byType, byStatus, totalStats] = await Promise.all([
      this.model.aggregate([{ $group: { _id: '$roomType', count: { $sum: 1 }, avgRent: { $avg: '$monthlyRent' } } }]),
      this.model.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      this.model.aggregate([{ $group: { _id: null, total: { $sum: 1 }, totalArea: { $sum: '$area' }, avgRent: { $avg: '$monthlyRent' } } }]),
    ]);
    return { byType, byStatus, total: totalStats[0] || { total: 0, totalArea: 0, avgRent: 0 } };
  }
}
