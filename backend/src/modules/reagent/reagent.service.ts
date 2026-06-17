import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reagent, ReagentDocument } from './schemas/reagent.schema';
import { CreateReagentDto, UpdateReagentDto, QueryReagentDto } from './dto/reagent.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { AuditAction } from '@/common/enums/index.enum';

@Injectable()
export class ReagentService {
  constructor(
    @InjectModel(Reagent.name) private reagentModel: Model<ReagentDocument>,
    private auditService: AuditService,
    private notificationService: NotificationService,
  ) {}

  async create(dto: CreateReagentDto, operatorId?: string): Promise<Reagent> {
    const reagent = new this.reagentModel({
      ...dto,
      availableQuantity: dto.availableQuantity ?? dto.totalQuantity,
      audit: { createdBy: operatorId, updatedBy: operatorId },
    });
    await reagent.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'reagent',
      targetId: reagent._id.toString(),
      targetName: reagent.name,
      operatorId,
      details: dto,
    });

    return reagent;
  }

  async findAll(query: QueryReagentDto): Promise<{ list: Reagent[]; total: number }> {
    const { keyword, category, isHazardous, hazardousCategory, lowStock, nearExpiry, page, pageSize } = query;
    const filter: any = { isActive: true };

    if (keyword) {
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { nameEn: { $regex: keyword, $options: 'i' } },
        { casNo: { $regex: keyword, $options: 'i' } },
        { batchNo: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (category) filter.category = category;
    if (isHazardous !== undefined) filter.isHazardous = isHazardous;
    if (hazardousCategory) filter.hazardousCategory = hazardousCategory;
    if (lowStock) {
      filter.$expr = { $lte: ['$availableQuantity', '$warningThreshold'] };
    }
    if (nearExpiry) {
      const nearDate = new Date();
      nearDate.setMonth(nearDate.getMonth() + 3);
      filter.expiryDate = { $lte: nearDate, $gte: new Date() };
    }

    const [list, total] = await Promise.all([
      this.reagentModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .populate('relatedProjects')
        .exec(),
      this.reagentModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findById(id: string): Promise<Reagent> {
    const reagent = await this.reagentModel.findById(id).populate('relatedProjects').exec();
    if (!reagent) throw new NotFoundException('试剂不存在');
    return reagent;
  }

  async update(id: string, dto: UpdateReagentDto, operatorId?: string): Promise<Reagent> {
    const reagent = await this.reagentModel.findById(id);
    if (!reagent) throw new NotFoundException('试剂不存在');

    Object.assign(reagent, dto, { audit: { ...reagent.audit, updatedBy: operatorId, updatedAt: new Date() } });
    await reagent.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'reagent',
      targetId: id,
      targetName: reagent.name,
      operatorId,
      details: dto,
    });

    if (reagent.availableQuantity <= reagent.warningThreshold) {
      await this.notificationService.sendLowStockAlert(reagent);
    }

    return reagent;
  }

  async remove(id: string, operatorId?: string): Promise<void> {
    const reagent = await this.reagentModel.findById(id);
    if (!reagent) throw new NotFoundException('试剂不存在');

    reagent.isActive = false;
    reagent.audit = { ...reagent.audit, updatedBy: operatorId, updatedAt: new Date() };
    await reagent.save();

    await this.auditService.create({
      action: AuditAction.DELETE,
      module: 'reagent',
      targetId: id,
      targetName: reagent.name,
      operatorId,
    });
  }

  async adjustStock(id: string, quantity: number, operatorId?: string, reason?: string): Promise<Reagent> {
    const reagent = await this.reagentModel.findById(id);
    if (!reagent) throw new NotFoundException('试剂不存在');

    const newQty = reagent.availableQuantity + quantity;
    if (newQty < 0) throw new BadRequestException('库存不足');

    reagent.availableQuantity = newQty;
    reagent.audit = { ...reagent.audit, updatedBy: operatorId, updatedAt: new Date() };
    await reagent.save();

    await this.auditService.create({
      action: AuditAction.UPDATE,
      module: 'reagent',
      targetId: id,
      targetName: reagent.name,
      operatorId,
      details: { quantity, reason, newAvailable: newQty },
    });

    return reagent;
  }

  async getStatistics(): Promise<any> {
    const [total, lowStock, nearExpiry, hazardous, byCategory] = await Promise.all([
      this.reagentModel.countDocuments({ isActive: true }),
      this.reagentModel.countDocuments({
        isActive: true,
        $expr: { $lte: ['$availableQuantity', '$warningThreshold'] },
      }),
      this.reagentModel.countDocuments({
        isActive: true,
        expiryDate: { $lte: new Date(Date.now() + 90 * 24 * 3600 * 1000), $gte: new Date() },
      }),
      this.reagentModel.countDocuments({ isActive: true, isHazardous: true }),
      this.reagentModel.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]),
    ]);

    return { total, lowStock, nearExpiry, hazardous, byCategory };
  }
}
