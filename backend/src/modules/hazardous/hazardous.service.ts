import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { HazardousLabel, HazardousLabelDocument } from './schemas/hazardous.schema';
import { CreateHazardousLabelDto, QueryHazardousLabelDto } from './dto/hazardous.dto';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../../common/enums/index.enum';

@Injectable()
export class HazardousService {
  constructor(
    @InjectModel(HazardousLabel.name) private hazardousModel: Model<HazardousLabelDocument>,
    private auditService: AuditService,
  ) {}

  async create(dto: CreateHazardousLabelDto, operatorId?: string): Promise<HazardousLabel> {
    const existing = await this.hazardousModel.findOne({ labelCode: dto.labelCode });
    if (existing) throw new ConflictException('标签编码已存在');

    const label = new this.hazardousModel({
      ...dto,
      relatedReagentIds: dto.relatedReagentIds?.map((id) => new Types.ObjectId(id)) || [],
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await label.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'hazardous',
      targetId: label._id.toString(),
      targetName: label.name,
      operatorId,
      details: dto,
    });

    return label;
  }

  async findAll(query: QueryHazardousLabelDto): Promise<{ list: HazardousLabel[]; total: number }> {
    const { category, keyword, page, pageSize } = query;
    const filter: any = { enabled: true };

    if (category) filter.category = category;
    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { labelCode: { $regex: keyword, $options: 'i' } },
      ];
    }

    const [list, total] = await Promise.all([
      this.hazardousModel.find(filter).skip((page - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).populate('relatedReagentIds relatedApplicationIds'),
      this.hazardousModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findById(id: string): Promise<HazardousLabel> {
    const label = await this.hazardousModel.findById(id).populate('relatedReagentIds relatedApplicationIds');
    if (!label) throw new NotFoundException('危化标签不存在');
    return label;
  }

  async update(id: string, dto: Partial<CreateHazardousLabelDto>, operatorId?: string): Promise<HazardousLabel> {
    const label = await this.hazardousModel.findById(id);
    if (!label) throw new NotFoundException('危化标签不存在');

    Object.assign(label, dto, {
      relatedReagentIds: dto.relatedReagentIds?.map((rid) => new Types.ObjectId(rid)) || label.relatedReagentIds,
      audit: { ...label.audit, updatedBy: operatorId, updatedAt: new Date() },
    });
    await label.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'hazardous',
      targetId: id,
      targetName: label.name,
      operatorId,
      details: dto,
    });

    return label;
  }
}
