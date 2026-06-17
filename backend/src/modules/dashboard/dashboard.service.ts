import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OriginalDocument, OriginalDocumentDocument } from './schemas/original-document.schema';
import { CreateOriginalDocumentDto, QueryOriginalDocumentDto } from './dto/dashboard.dto';
import { AuditService } from '../audit/audit.service';
import { UsersService } from '../users/users.service';
import { ReagentService } from '../reagent/reagent.service';
import { ApplicationService } from '../application/application.service';
import { AuditAction } from '../../common/enums/index.enum';
import { Inject, forwardRef } from '@nestjs/common';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(OriginalDocument.name) private documentModel: Model<OriginalDocumentDocument>,
    private auditService: AuditService,
    private usersService: UsersService,
    @Inject(forwardRef(() => ReagentService)) private reagentService: ReagentService,
    @Inject(forwardRef(() => ApplicationService)) private applicationService: ApplicationService,
  ) {}

  async createDocument(dto: CreateOriginalDocumentDto, operatorId?: string): Promise<OriginalDocument> {
    const existing = await this.documentModel.findOne({ documentNo: dto.documentNo });
    if (existing) throw new ConflictException('单据编号已存在');

    let uploaderName = '';
    if (operatorId) {
      try {
        const user = await this.usersService.findById(operatorId);
        uploaderName = user.realName;
      } catch {}
    }

    const doc = new this.documentModel({
      ...dto,
      documentDate: dto.documentDate ? new Date(dto.documentDate) : new Date(),
      relatedReagentIds: dto.relatedReagentIds?.map((id) => new Types.ObjectId(id)) || [],
      relatedApplicationIds: dto.relatedApplicationIds?.map((id) => new Types.ObjectId(id)) || [],
      relatedSampleIds: dto.relatedSampleIds?.map((id) => new Types.ObjectId(id)) || [],
      relatedProjectIds: dto.relatedProjectIds?.map((id) => new Types.ObjectId(id)) || [],
      uploadedBy: operatorId,
      uploadedByName: uploaderName,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await doc.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'original_document',
      targetId: doc._id.toString(),
      targetName: doc.documentNo,
      operatorId,
      details: dto,
    });

    return doc;
  }

  async findDocuments(query: QueryOriginalDocumentDto): Promise<{ list: OriginalDocument[]; total: number }> {
    const { keyword, documentType, relatedModule, relatedId, page, pageSize } = query;
    const filter: any = { isActive: true };

    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { documentNo: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (documentType) filter.documentType = documentType;
    if (relatedModule && relatedId) {
      const fieldMap: Record<string, string> = {
        reagent: 'relatedReagentIds',
        application: 'relatedApplicationIds',
        sample: 'relatedSampleIds',
        project: 'relatedProjectIds',
      };
      const field = fieldMap[relatedModule];
      if (field) filter[field] = new Types.ObjectId(relatedId);
    }

    const [list, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .populate('relatedReagentIds relatedApplicationIds relatedSampleIds relatedProjectIds')
        .exec(),
      this.documentModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findDocumentById(id: string): Promise<OriginalDocument> {
    const doc = await this.documentModel.findById(id)
      .populate('relatedReagentIds relatedApplicationIds relatedSampleIds relatedProjectIds');
    if (!doc) throw new NotFoundException('单据不存在');
    return doc;
  }

  async getOverview(): Promise<any> {
    const [reagentStats, applicationStats, sampleStats, docCount] = await Promise.all([
      this.reagentService.getStatistics(),
      this.applicationService.getStatistics(),
      (this as any).sampleStats?.() || { total: 0, unknown: 0, inUse: 0, byStatus: [] },
      this.documentModel.countDocuments({ isActive: true }),
    ]);

    return {
      reagents: reagentStats,
      applications: applicationStats,
      documents: docCount,
      timestamp: new Date().toISOString(),
    };
  }
}
