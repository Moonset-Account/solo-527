import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { CustomerRequirement, RequirementStatus } from '../../entities/customer-requirement.entity';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';

@Injectable()
export class CustomerRequirementService {
  constructor(
    @InjectRepository(CustomerRequirement)
    private requirementRepository: Repository<CustomerRequirement>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private notificationService: NotificationService,
  ) {}

  async findAll(
    user: User,
    filters?: {
      status?: RequirementStatus;
      keyword?: string;
      destination?: string;
      assignedToId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: CustomerRequirement[]; total: number; page: number; limit: number }> {
    const options: FindManyOptions<CustomerRequirement> = {
      relations: ['assignedTo'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      where: {},
    };

    if (user.role === UserRole.SALES) {
      options.where = { createdBy: user.id };
    }

    if (filters?.status) {
      options.where['status'] = filters.status;
    }

    if (filters?.keyword) {
      options.where = [
        { customerName: Like(`%${filters.keyword}%`), ...options.where },
        { customerPhone: Like(`%${filters.keyword}%`), ...options.where },
        { destination: Like(`%${filters.keyword}%`), ...options.where },
      ] as any;
    }

    if (filters?.destination) {
      options.where['destination'] = filters.destination;
    }

    if (filters?.assignedToId) {
      options.where['assignedToId'] = filters.assignedToId;
    }

    const [data, total] = await this.requirementRepository.findAndCount(options);
    return { data, total, page, limit };
  }

  async findById(id: string, user?: User): Promise<CustomerRequirement> {
    const requirement = await this.requirementRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'quotes'],
    });

    if (!requirement) {
      throw new NotFoundException('客户需求不存在');
    }

    if (user && user.role === UserRole.SALES && requirement.createdBy !== user.id) {
      throw new ForbiddenException('无权访问此需求');
    }

    return requirement;
  }

  async create(data: Partial<CustomerRequirement>, user: User): Promise<CustomerRequirement> {
    const requirement = this.requirementRepository.create({
      ...data,
      createdBy: user.id,
      updatedBy: user.id,
      status: RequirementStatus.DRAFT,
    });

    const saved = await this.requirementRepository.save(requirement);
    await this.createAuditLog(saved.id, AuditAction.CREATE, user, null, JSON.stringify(saved));
    return saved;
  }

  async update(id: string, data: Partial<CustomerRequirement>, user: User): Promise<CustomerRequirement> {
    const requirement = await this.findById(id, user);

    if (requirement.status === RequirementStatus.CONFIRMED || requirement.status === RequirementStatus.CANCELLED) {
      throw new ForbiddenException('此状态下无法修改需求');
    }

    const oldValue = JSON.stringify(requirement);
    Object.assign(requirement, data);
    requirement.updatedBy = user.id;

    const saved = await this.requirementRepository.save(requirement);
    await this.createAuditLog(saved.id, AuditAction.UPDATE, user, oldValue, JSON.stringify(saved));
    return saved;
  }

  async submit(id: string, user: User): Promise<CustomerRequirement> {
    const requirement = await this.findById(id, user);

    if (requirement.status !== RequirementStatus.DRAFT) {
      throw new ForbiddenException('只有草稿状态才能提交');
    }

    requirement.status = RequirementStatus.SUBMITTED;
    requirement.updatedBy = user.id;

    const saved = await this.requirementRepository.save(requirement);
    await this.createAuditLog(saved.id, AuditAction.STATUS_CHANGE, user, RequirementStatus.DRAFT, RequirementStatus.SUBMITTED);

    const productManagers = await this.getProductManagers();
    for (const pm of productManagers) {
      await this.notificationService.create({
        recipientId: pm.id,
        type: NotificationType.REQUIREMENT_ASSIGNED,
        title: '新需求待处理',
        content: `客户 ${saved.customerName} 的新需求需要处理，目的地：${saved.destination}`,
        relatedData: {
          entityType: 'CustomerRequirement',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  async assign(id: string, assignedToId: string, user: User): Promise<CustomerRequirement> {
    const requirement = await this.findById(id);

    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.PRODUCT_MANAGER].includes(user.role)) {
      throw new ForbiddenException('无权分配需求');
    }

    requirement.assignedToId = assignedToId;
    requirement.status = RequirementStatus.IN_PROGRESS;
    requirement.updatedBy = user.id;

    const saved = await this.requirementRepository.save(requirement);

    await this.notificationService.create({
      recipientId: assignedToId,
      type: NotificationType.REQUIREMENT_ASSIGNED,
      title: '新需求已分配给您',
      content: `客户 ${saved.customerName} 的需求已分配给您处理`,
      relatedData: {
        entityType: 'CustomerRequirement',
        entityId: saved.id,
      },
    });

    return saved;
  }

  async updateStatus(id: string, status: RequirementStatus, user: User, comments?: string): Promise<CustomerRequirement> {
    const requirement = await this.findById(id, user);
    const oldStatus = requirement.status;

    requirement.status = status;
    requirement.updatedBy = user.id;

    const saved = await this.requirementRepository.save(requirement);
    await this.createAuditLog(saved.id, AuditAction.STATUS_CHANGE, user, oldStatus, status);

    if (requirement.createdBy && requirement.createdBy !== user.id) {
      await this.notificationService.create({
        recipientId: requirement.createdBy,
        type: NotificationType.STATUS_CHANGE,
        title: '需求状态已更新',
        content: `您提交的客户 ${saved.customerName} 的需求状态已更新为：${status}`,
        relatedData: {
          entityType: 'CustomerRequirement',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  private async createAuditLog(
    entityId: string,
    action: AuditAction,
    user: User,
    oldValue: string | null,
    newValue: string | null,
    fieldName?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      entityType: 'CustomerRequirement',
      entityId,
      action,
      oldValue,
      newValue,
      fieldName,
      userId: user.id,
    });
    await this.auditLogRepository.save(auditLog);
  }

  private async getProductManagers(): Promise<User[]> {
    return [];
  }
}
