import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { Model, Types } from 'mongoose';
import { Sample, SampleDocument } from './schemas/sample.schema';
import { CreateSampleDto, UpdateSampleStatusDto, QuerySampleDto } from './dto/sample.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { UsersService } from '../users/users.service';
import { AuditAction, SampleStatus } from '../../common/enums/index.enum';

@Injectable()
export class SampleService {
  constructor(
    @InjectModel(Sample.name) private sampleModel: Model<SampleDocument>,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private usersService: UsersService,
  ) {}

  async create(dto: CreateSampleDto, operatorId?: string): Promise<Sample> {
    const existing = await this.sampleModel.findOne({ sampleCode: dto.sampleCode });
    if (existing) throw new ConflictException('样本编号已存在');

    let holderName = '';
    if (dto.currentHolderId) {
      try {
        const holder = await this.usersService.findById(dto.currentHolderId);
        holderName = holder.realName;
      } catch {}
    }

    const sample = new this.sampleModel({
      ...dto,
      projectId: dto.projectId ? new Types.ObjectId(dto.projectId) : undefined,
      relatedReagentId: dto.relatedReagentId ? new Types.ObjectId(dto.relatedReagentId) : undefined,
      relatedApplicationIds: dto.relatedApplicationIds?.map((id) => new Types.ObjectId(id)) || [],
      originalDocumentId: dto.originalDocumentId ? new Types.ObjectId(dto.originalDocumentId) : undefined,
      currentHolderName: holderName,
      audit: { createdBy: operatorId, updatedBy: operatorId },
      trackingHistory: [{
        status: dto.status || SampleStatus.STORAGE,
        time: new Date(),
        operatorId,
        location: dto.storageLocation,
      }],
    });
    await sample.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'sample',
      targetId: sample._id.toString(),
      targetName: sample.sampleCode,
      operatorId,
      details: dto,
    });

    return sample;
  }

  async findAll(query: QuerySampleDto): Promise<{ list: Sample[]; total: number }> {
    const { keyword, status, projectId, currentHolderId, unknownOnly, page, pageSize } = query;
    const filter: any = { isActive: true };

    if (keyword) {
      filter.$or = [
        { sampleCode: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (projectId) filter.projectId = new Types.ObjectId(projectId);
    if (currentHolderId) filter.currentHolderId = currentHolderId;
    if (unknownOnly) filter.status = SampleStatus.UNKNOWN;

    const [list, total] = await Promise.all([
      this.sampleModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .populate('projectId relatedReagentId relatedApplicationIds originalDocumentId')
        .exec(),
      this.sampleModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findById(id: string): Promise<Sample> {
    const sample = await this.sampleModel.findById(id)
      .populate('projectId relatedReagentId relatedApplicationIds originalDocumentId');
    if (!sample) throw new NotFoundException('样本不存在');
    return sample;
  }

  async updateStatus(id: string, dto: UpdateSampleStatusDto, operatorId?: string): Promise<Sample> {
    const sample = await this.sampleModel.findById(id);
    if (!sample) throw new NotFoundException('样本不存在');

    let holderName = sample.currentHolderName;
    if (dto.holderId && dto.holderId !== sample.currentHolderId) {
      try {
        const holder = await this.usersService.findById(dto.holderId);
        holderName = holder.realName;
      } catch {}
    }

    sample.status = dto.status;
    if (dto.location) sample.storageLocation = dto.location;
    if (dto.holderId) {
      sample.currentHolderId = dto.holderId;
      sample.currentHolderName = holderName;
    }
    sample.lastCheckedAt = new Date();
    sample.trackingHistory.push({
      status: dto.status,
      time: new Date(),
      operatorId,
      location: dto.location || sample.storageLocation,
      remark: dto.remark,
    });
    sample.audit = { ...sample.audit, updatedBy: operatorId, updatedAt: new Date() };
    await sample.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'sample',
      targetId: id,
      targetName: sample.sampleCode,
      operatorId,
      details: dto,
    });

    if (dto.status === SampleStatus.UNKNOWN) {
      await this.notificationService.sendSampleUnknownAlert(sample);
    }

    return sample;
  }

  @Cron('0 0 9 * * *')
  async checkUnknownSamplesDaily() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const unknownSamples = await this.sampleModel.find({
      status: SampleStatus.UNKNOWN,
      lastCheckedAt: { $lt: sevenDaysAgo },
      isActive: true,
    });

    for (const sample of unknownSamples) {
      await this.notificationService.sendSampleUnknownAlert(sample);
    }
  }

  async getStatistics(): Promise<any> {
    const [total, unknown, inUse, byStatus] = await Promise.all([
      this.sampleModel.countDocuments({ isActive: true }),
      this.sampleModel.countDocuments({ isActive: true, status: SampleStatus.UNKNOWN }),
      this.sampleModel.countDocuments({ isActive: true, status: SampleStatus.IN_USE }),
      this.sampleModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    return { total, unknown, inUse, byStatus };
  }
}
