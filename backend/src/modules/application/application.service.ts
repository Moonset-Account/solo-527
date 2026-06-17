import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Application, ApplicationDocument } from './schemas/application.schema';
import {
  CreateApplicationDto,
  SubmitApplicationDto,
  ApproveApplicationDto,
  RejectApplicationDto,
  PickApplicationDto,
  QueryApplicationDto,
} from './dto/application.dto';
import { AuditService } from '../audit/audit.service';
import { NotificationService } from '../notification/notification.service';
import { ReagentService } from '../reagent/reagent.service';
import { UsersService } from '../users/users.service';
import { ApplicationStatus, AuditAction, UserRole } from '../../common/enums/index.enum';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    private auditService: AuditService,
    private notificationService: NotificationService,
    private reagentService: ReagentService,
    private usersService: UsersService,
  ) {}

  private generateApplicationNo(): string {
    const date = new Date();
    const ymd = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `RA${ymd}${random}`;
  }

  async create(dto: CreateApplicationDto, userId: string): Promise<Application> {
    const user = await this.usersService.findById(userId);

    const application = new this.applicationModel({
      ...dto,
      applicationNo: this.generateApplicationNo(),
      status: ApplicationStatus.DRAFT,
      applicantId: userId,
      applicantName: user.realName,
      applicantDepartment: user.department,
      applicantLaboratory: user.laboratory,
      audit: { createdBy: userId, updatedBy: userId },
    });
    await application.save();

    await this.auditService.create({
      action: AuditAction.CREATE,
      module: 'application',
      targetId: application._id.toString(),
      targetName: application.applicationNo,
      operatorId: userId,
      operatorName: user.realName,
      details: dto,
    });

    return application;
  }

  async submit(id: string, userId: string, dto?: SubmitApplicationDto): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new NotFoundException('申请不存在');
    if (application.applicantId !== userId) throw new ForbiddenException('只能提交自己的申请');
    if (application.status !== ApplicationStatus.DRAFT) throw new BadRequestException('只有草稿状态可以提交');

    application.status = ApplicationStatus.PENDING;
    if (dto?.remarks) application.remarks = dto.remarks;
    application.audit = { ...application.audit, updatedBy: userId, updatedAt: new Date() };
    await application.save();

    const user = await this.usersService.findById(userId);
    await this.auditService.create({
      action: AuditAction.SUBMIT,
      module: 'application',
      targetId: id,
      targetName: application.applicationNo,
      operatorId: userId,
      operatorName: user.realName,
      details: dto,
    });

    await this.notificationService.sendApplicationSubmitted(application);

    return application;
  }

  async approve(id: string, approverId: string, dto: ApproveApplicationDto): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new NotFoundException('申请不存在');
    if (application.status !== ApplicationStatus.PENDING) throw new BadRequestException('只有待审核状态可以审批');

    const approver = await this.usersService.findById(approverId);
    application.status = ApplicationStatus.APPROVED;
    application.approval = {
      approverId,
      approverName: approver.realName,
      approvedAt: new Date(),
      remark: dto.remark,
    };
    application.audit = { ...application.audit, updatedBy: approverId, updatedAt: new Date() };
    await application.save();

    await this.auditService.create({
      action: AuditAction.APPROVE,
      module: 'application',
      targetId: id,
      targetName: application.applicationNo,
      operatorId: approverId,
      operatorName: approver.realName,
      details: dto,
    });

    await this.notificationService.sendApplicationApproved(application);

    return application;
  }

  async reject(id: string, approverId: string, dto: RejectApplicationDto): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new NotFoundException('申请不存在');
    if (application.status !== ApplicationStatus.PENDING) throw new BadRequestException('只有待审核状态可以审批');

    const approver = await this.usersService.findById(approverId);
    application.status = ApplicationStatus.REJECTED;
    application.rejectReason = dto.reason;
    application.audit = { ...application.audit, updatedBy: approverId, updatedAt: new Date() };
    await application.save();

    await this.auditService.create({
      action: AuditAction.REJECT,
      module: 'application',
      targetId: id,
      targetName: application.applicationNo,
      operatorId: approverId,
      operatorName: approver.realName,
      details: dto,
    });

    await this.notificationService.sendApplicationRejected(application, dto.reason);

    return application;
  }

  async pick(id: string, operatorId: string, dto: PickApplicationDto): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new NotFoundException('申请不存在');
    if (application.status !== ApplicationStatus.APPROVED) throw new BadRequestException('只有已通过状态可以领取');

    const operator = await this.usersService.findById(operatorId);

    for (const item of dto.items) {
      const appItem = application.items.find((i) => i.reagentId.toString() === item.reagentId);
      if (appItem) {
        appItem.actualQuantity = item.actualQuantity;
      }
      await this.reagentService.adjustStock(item.reagentId, -item.actualQuantity, operatorId, `申请单 ${application.applicationNo} 领用`);
    }

    application.status = ApplicationStatus.PICKED;
    application.pickedAt = new Date();
    application.pickedBy = operatorId;
    application.pickedByName = operator.realName;
    application.audit = { ...application.audit, updatedBy: operatorId, updatedAt: new Date() };
    await application.save();

    await this.auditService.create({
      action: AuditAction.PICK,
      module: 'application',
      targetId: id,
      targetName: application.applicationNo,
      operatorId,
      operatorName: operator.realName,
      details: dto,
    });

    return application;
  }

  async cancel(id: string, userId: string): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) throw new NotFoundException('申请不存在');
    if (application.applicantId !== userId) throw new ForbiddenException('只能取消自己的申请');
    if (![ApplicationStatus.DRAFT, ApplicationStatus.PENDING].includes(application.status)) {
      throw new BadRequestException('当前状态不可取消');
    }

    application.status = ApplicationStatus.CANCELLED;
    application.audit = { ...application.audit, updatedBy: userId, updatedAt: new Date() };
    await application.save();

    const user = await this.usersService.findById(userId);
    await this.auditService.create({
      action: AuditAction.CANCEL,
      module: 'application',
      targetId: id,
      targetName: application.applicationNo,
      operatorId: userId,
      operatorName: user.realName,
    });

    return application;
  }

  async findAll(query: QueryApplicationDto, userRoles?: string[], userId?: string): Promise<{ list: Application[]; total: number }> {
    const { status, type, applicantId, keyword, startDate, endDate, projectId, page, pageSize } = query;
    const filter: any = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (applicantId) filter.applicantId = applicantId;
    if (projectId) filter.projectId = projectId;

    const isManager = userRoles?.some((r) => [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.REAGENT_MANAGER].includes(r as UserRole));
    if (!isManager && userId) {
      filter.applicantId = userId;
    }

    if (keyword) {
      filter.$or = [
        { applicationNo: { $regex: keyword, $options: 'i' } },
        { applicantName: { $regex: keyword, $options: 'i' } },
        { purpose: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [list, total] = await Promise.all([
      this.applicationModel
        .find(filter)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .populate('projectId')
        .populate('relatedInstrumentBookingId')
        .populate('relatedHazardousLabelIds')
        .populate('relatedSampleIds')
        .exec(),
      this.applicationModel.countDocuments(filter),
    ]);

    return { list, total };
  }

  async findById(id: string): Promise<Application> {
    const application = await this.applicationModel.findById(id)
      .populate('projectId')
      .populate('relatedInstrumentBookingId')
      .populate('relatedHazardousLabelIds')
      .populate('relatedSampleIds')
      .exec();
    if (!application) throw new NotFoundException('申请不存在');
    return application;
  }

  async getStatistics(): Promise<any> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, pending, approved, rejected, picked, thisMonth, byStatus] = await Promise.all([
      this.applicationModel.countDocuments(),
      this.applicationModel.countDocuments({ status: ApplicationStatus.PENDING }),
      this.applicationModel.countDocuments({ status: ApplicationStatus.APPROVED }),
      this.applicationModel.countDocuments({ status: ApplicationStatus.REJECTED }),
      this.applicationModel.countDocuments({ status: ApplicationStatus.PICKED }),
      this.applicationModel.countDocuments({ createdAt: { $gte: startOfMonth } }),
      this.applicationModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    return { total, pending, approved, rejected, picked, thisMonth, byStatus };
  }
}
