import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Lead, LeadDocument, LeadStatus } from '../../schemas/lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AssignLeadDto } from './dto/assign-lead.dto';
import { BatchAssignLeadDto } from './dto/batch-assign.dto';
import { LeadQueryDto } from './dto/lead-query.dto';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { RedisService } from '../../shared/redis/redis.service';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    private redisService: RedisService,
  ) {}

  async findAll(query: LeadQueryDto): Promise<PaginatedResponse<Lead>> {
    const { page, pageSize, customerName, phone, source, intention, status, assigneeId } = query;
    const skip = (page - 1) * pageSize;

    const filter: any = {};
    if (customerName) filter.customerName = { $regex: customerName, $options: 'i' };
    if (phone) filter.phone = { $regex: phone, $options: 'i' };
    if (source) filter.source = source;
    if (intention) filter.intention = intention;
    if (status) filter.status = status;
    if (assigneeId) filter.assigneeId = new Types.ObjectId(assigneeId);

    const [list, total] = await Promise.all([
      this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).exec(),
      this.leadModel.countDocuments(filter).exec(),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadModel.findById(id).exec();
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }
    return lead;
  }

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const lead = new this.leadModel(createLeadDto);
    return lead.save();
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.leadModel.findByIdAndUpdate(id, updateLeadDto, { new: true }).exec();
    if (!lead) {
      throw new NotFoundException('线索不存在');
    }
    return lead;
  }

  async assign(id: string, assignLeadDto: AssignLeadDto): Promise<Lead> {
    const lockKey = `lead:assign:lock:${id}`;
    const lockValue = Date.now().toString();

    const locked = await this.redisService.getClient().set(lockKey, lockValue, 'EX', 10, 'NX');
    if (!locked) {
      throw new ConflictException('该线索正在被分配，请稍后再试');
    }

    try {
      const lead = await this.leadModel.findById(id).exec();
      if (!lead) {
        throw new NotFoundException('线索不存在');
      }

      lead.status = LeadStatus.FOLLOWING as any;
      lead.assigneeId = assignLeadDto.assigneeId;
      lead.assigneeName = assignLeadDto.assigneeName;
      lead.assignedAt = new Date();

      return lead.save();
    } finally {
      const currentValue = await this.redisService.get(lockKey);
      if (currentValue === lockValue) {
        await this.redisService.del(lockKey);
      }
    }
  }

  async batchAssign(batchAssignLeadDto: BatchAssignLeadDto): Promise<{ success: number; failed: number; errors: string[] }> {
    const { leadIds, assigneeId, assigneeName } = batchAssignLeadDto;
    const result = { success: 0, failed: 0, errors: [] };

    for (const leadId of leadIds) {
      try {
        const lockKey = `lead:assign:lock:${leadId}`;
        const lockValue = Date.now().toString();

        const locked = await this.redisService.getClient().set(lockKey, lockValue, 'EX', 10, 'NX');
        if (!locked) {
          result.failed++;
          result.errors.push(`线索 ${leadId} 正在被分配，跳过`);
          continue;
        }

        try {
          const lead = await this.leadModel.findById(leadId).exec();
          if (!lead) {
            result.failed++;
            result.errors.push(`线索 ${leadId} 不存在`);
            continue;
          }

          lead.status = LeadStatus.FOLLOWING as any;
          lead.assigneeId = assigneeId;
          lead.assigneeName = assigneeName;
          lead.assignedAt = new Date();

          await lead.save();
          result.success++;
        } finally {
          const currentValue = await this.redisService.get(lockKey);
          if (currentValue === lockValue) {
            await this.redisService.del(lockKey);
          }
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`线索 ${leadId} 分配失败: ${error.message}`);
      }
    }

    return result;
  }
}
