import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Contract, ContractStatus, ContractType, UrgencyLevel } from '../../entities/contract.entity';
import { ContractNumberPool, NumberPoolStatus } from '../../entities/contract-number-pool.entity';
import { ContractAttachment } from '../../entities/contract-attachment.entity';
import { ApprovalFlow, ApprovalStatus } from '../../entities/approval-flow.entity';
import { FileResource } from '../../entities/file-resource.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { User } from '../../entities/user.entity';
import { NotificationService } from '../notification/notification.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface CreateContractDto {
  title: string;
  summary?: string;
  contractType: ContractType;
  urgency?: UrgencyLevel;
  partyA: string;
  partyB: string;
  amount?: number;
  currency?: string;
  effectiveDate?: Date;
  expiryDate?: Date;
  ownerId?: string;
  materialChecklist?: { name: string; required: boolean; uploaded: boolean; remark?: string }[];
  customFields?: Record<string, any>;
}

export interface QueryContractDto {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: ContractStatus;
  contractType?: ContractType;
  urgency?: UrgencyLevel;
  department?: string;
  applicantId?: string;
  ownerId?: string;
  materialsComplete?: boolean;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  amountMin?: number;
  amountMax?: number;
  hasRejectionReason?: boolean;
  hasAttachments?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ReserveNumberDto {
  ruleType?: string;
  prefix?: string;
}

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract) private contractRepo: Repository<Contract>,
    @InjectRepository(ContractNumberPool) private numberPoolRepo: Repository<ContractNumberPool>,
    @InjectRepository(ContractAttachment) private attachmentRepo: Repository<ContractAttachment>,
    @InjectRepository(ApprovalFlow) private approvalRepo: Repository<ApprovalFlow>,
    @InjectRepository(FileResource) private fileResourceRepo: Repository<FileResource>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationService: NotificationService,
  ) {}

  async reserveNumber(dto: ReserveNumberDto, userId: string) {
    const year = new Date().getFullYear();
    const prefix = dto.prefix || 'HT';
    const ruleType = dto.ruleType || 'standard';

    const latest = await this.numberPoolRepo
      .createQueryBuilder('np')
      .where('np.prefix = :prefix AND np.year = :year', { prefix, year })
      .orderBy('np.seqNo', 'DESC')
      .getOne();

    const nextSeq = latest ? latest.seqNo + 1 : 1;
    const contractNo = `${prefix}-${year}-${String(nextSeq).padStart(5, '0')}`;

    const pool = this.numberPoolRepo.create({
      contractNo,
      prefix,
      year,
      seqNo: nextSeq,
      status: NumberPoolStatus.RESERVED,
      appliedBy: userId,
      ruleType,
      reservedExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    await this.numberPoolRepo.save(pool);
    return { contractNo, reserved: true, expiresAt: pool.reservedExpireAt };
  }

  async getNumberPoolStats() {
    const total = await this.numberPoolRepo.count();
    const used = await this.numberPoolRepo.count({ where: { status: NumberPoolStatus.USED } });
    const available = await this.numberPoolRepo.count({ where: { status: NumberPoolStatus.AVAILABLE } });
    const reserved = await this.numberPoolRepo.count({ where: { status: NumberPoolStatus.RESERVED } });
    return { total, used, available, reserved };
  }

  async listNumberPool(page = 1, pageSize = 20, status?: NumberPoolStatus) {
    const qb = this.numberPoolRepo.createQueryBuilder('np');
    if (status) qb.where('np.status = :status', { status });
    const [list, total] = await qb
      .orderBy('np.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { list, total, page, pageSize };
  }

  async createContract(dto: CreateContractDto, user: CurrentUserPayload) {
    let contractNo: string;
    const reservedNum = await this.numberPoolRepo.findOne({
      where: { appliedBy: user.id, status: NumberPoolStatus.RESERVED },
      order: { createdAt: 'DESC' },
    });

    if (reservedNum) {
      contractNo = reservedNum.contractNo;
      reservedNum.status = NumberPoolStatus.USED;
      reservedNum.usedAt = new Date();
      await this.numberPoolRepo.save(reservedNum);
    } else {
      const res = await this.reserveNumber({}, user.id);
      contractNo = res.contractNo;
      const pool = await this.numberPoolRepo.findOne({ where: { contractNo } });
      if (pool) {
        pool.status = NumberPoolStatus.USED;
        pool.usedAt = new Date();
        await this.numberPoolRepo.save(pool);
      }
    }

    const materialsComplete =
      dto.materialChecklist?.filter((m) => m.required).every((m) => m.uploaded) ?? false;

    const contract = this.contractRepo.create({
      ...dto,
      contractNo,
      applicantId: user.id,
      ownerId: dto.ownerId || user.id,
      currency: dto.currency || 'CNY',
      materialsComplete,
    });
    const saved = await this.contractRepo.save(contract);

    await this.addAuditLog(user.id, user.realName, AuditAction.CREATE, 'contract', saved.id, saved.title, null, dto);

    return saved;
  }

  async updateContract(id: string, dto: Partial<CreateContractDto>, user: CurrentUserPayload) {
    const contract = await this.getContract(id);
    this.checkPermission(contract, user, ['contract:update']);

    const beforeData = { ...contract };

    if (dto.materialChecklist) {
      const materialsComplete = dto.materialChecklist
        .filter((m) => m.required)
        .every((m) => m.uploaded);

      Object.assign(contract, dto, { materialsComplete });

      if (materialsComplete && !contract.materialsComplete) {
        const owner = await this.userRepo.findOne({ where: { id: contract.ownerId } });
        if (owner) {
          await this.notificationService.createNotification({
            recipientId: owner.id,
            recipientTarget: owner.phone,
            type: 'material_complete',
            channel: 'in_app',
            title: '合同材料已完整',
            content: `【${contract.contractNo}】${contract.title} 材料已完整，请及时处理。`,
            relatedData: { contractId: contract.id },
          });
          if (owner.email) {
            await this.notificationService.createNotification({
              recipientId: owner.id,
              recipientTarget: owner.email,
              type: 'material_complete',
              channel: 'email',
              title: '合同材料已完整',
              content: `【${contract.contractNo}】${contract.title} 材料已完整，请及时处理。`,
              relatedData: { contractId: contract.id },
            });
          }
        }
      } else if (!materialsComplete && contract.materialsComplete) {
        const owner = await this.userRepo.findOne({ where: { id: contract.ownerId } });
        if (owner) {
          await this.notificationService.createNotification({
            recipientId: owner.id,
            type: 'material_incomplete',
            channel: 'in_app',
            title: '合同材料不完整',
            content: `【${contract.contractNo}】${contract.title} 材料不完整，请补充。`,
            relatedData: { contractId: contract.id },
          });
        }
      }
    } else {
      Object.assign(contract, dto);
    }

    const saved = await this.contractRepo.save(contract);
    await this.addAuditLog(user.id, user.realName, AuditAction.UPDATE, 'contract', saved.id, saved.title, beforeData, dto);
    return saved;
  }

  async getContract(id: string) {
    const contract = await this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.applicant', 'applicant')
      .leftJoinAndSelect('c.owner', 'owner')
      .leftJoinAndMapMany('c.attachments', ContractAttachment, 'att', 'att.contractId = c.id')
      .where('c.id = :id', { id })
      .getOne();

    if (!contract) throw new NotFoundException('合同不存在');
    return contract;
  }

  async queryContracts(query: QueryContractDto, user: CurrentUserPayload) {
    const { page = 1, pageSize = 20, keyword, status, contractType, urgency, department, applicantId, ownerId, materialsComplete, dateRangeStart, dateRangeEnd, amountMin, amountMax, hasRejectionReason, hasAttachments, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const qb = this.contractRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.applicant', 'applicant')
      .leftJoinAndSelect('c.owner', 'owner');

    if (keyword) {
      qb.andWhere(
        new Brackets((sq) => {
          sq.where('c.contractNo ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.title ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.partyA ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.partyB ILIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }
    if (status) qb.andWhere('c.status = :status', { status });
    if (contractType) qb.andWhere('c.contractType = :contractType', { contractType });
    if (urgency) qb.andWhere('c.urgency = :urgency', { urgency });
    if (department) qb.andWhere('applicant.department = :dept', { dept: department });
    if (applicantId) qb.andWhere('c.applicantId = :applicantId', { applicantId });
    if (ownerId) qb.andWhere('c.ownerId = :ownerId', { ownerId });
    if (materialsComplete !== undefined) qb.andWhere('c.materialsComplete = :mc', { mc: materialsComplete });
    if (dateRangeStart) qb.andWhere('c.createdAt >= :ds', { ds: dateRangeStart });
    if (dateRangeEnd) qb.andWhere('c.createdAt <= :de', { de: dateRangeEnd });
    if (amountMin !== undefined) qb.andWhere('c.amount >= :am', { am: amountMin });
    if (amountMax !== undefined) qb.andWhere('c.amount <= :aM', { aM: amountMax });
    if (hasRejectionReason === true) qb.andWhere('c.rejectionReason IS NOT NULL AND c.rejectionReason <> \'\'');
    if (hasRejectionReason === false) qb.andWhere('c.rejectionReason IS NULL OR c.rejectionReason = \'\'');
    if (hasAttachments !== undefined) {
      qb.andWhere(hasAttachments
        ? 'EXISTS (SELECT 1 FROM contract_attachments ca WHERE ca."contractId" = c.id)'
        : 'NOT EXISTS (SELECT 1 FROM contract_attachments ca WHERE ca."contractId" = c.id)');
    }

    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    if (!isAdmin) {
      qb.andWhere(new Brackets((sq) => {
        sq.where('c.applicantId = :uid', { uid: user.id })
          .orWhere('c.ownerId = :uid', { uid: user.id })
          .orWhere('EXISTS (SELECT 1 FROM approval_flows af WHERE af."contractId" = c.id AND af."approverId" = :uid)', { uid: user.id });
      }));
    }

    const validSort = ['createdAt', 'updatedAt', 'amount', 'urgency'];
    const sortCol = validSort.includes(sortBy) ? `c.${sortBy}` : 'c.createdAt';
    qb.orderBy(sortCol, sortOrder);

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();

    return { list, total, page, pageSize };
  }

  async getApprovalProgress(contractId: string) {
    const flows = await this.approvalRepo
      .createQueryBuilder('af')
      .leftJoinAndSelect('af.approver', 'approver')
      .leftJoinAndSelect('af.transferredTo', 'transferredTo')
      .where('af.contractId = :id', { id: contractId })
      .orderBy('af.stepOrder', 'ASC')
      .getMany();

    const contract = await this.getContract(contractId);

    let currentStep = 0;
    for (let i = 0; i < flows.length; i++) {
      if (flows[i].status === ApprovalStatus.PENDING) {
        currentStep = i + 1;
        break;
      }
    }

    return {
      contract: {
        id: contract.id,
        contractNo: contract.contractNo,
        title: contract.title,
        status: contract.status,
        urgency: contract.urgency,
        applicant: { id: contract.applicant?.id, realName: contract.applicant?.realName },
        createdAt: contract.createdAt,
      },
      currentStep,
      totalSteps: flows.length,
      steps: flows.map((f) => ({
        id: f.id,
        nodeName: f.nodeName,
        stepOrder: f.stepOrder,
        approver: f.approver ? { id: f.approver.id, realName: f.approver.realName, avatar: f.approver.avatar, phone: f.approver.phone } : null,
        transferredTo: f.transferredTo ? { id: f.transferredTo.id, realName: f.transferredTo.realName } : null,
        status: f.status,
        opinion: f.opinion,
        rejectionReason: f.rejectionReason,
        approvedAt: f.approvedAt,
        createdAt: f.createdAt,
        durationHours: f.durationHours,
      })),
    };
  }

  async getStats(user: CurrentUserPayload) {
    const baseQb = this.contractRepo.createQueryBuilder('c');
    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    if (!isAdmin) {
      baseQb.where('c.applicantId = :uid OR c.ownerId = :uid', { uid: user.id });
    }

    const total = await baseQb.getCount();
    const byStatus: Record<string, number> = {};
    for (const s of Object.values(ContractStatus)) {
      byStatus[s] = await this.contractRepo.createQueryBuilder('c')
        .where('c.status = :s', { s })
        .andWhere(isAdmin ? '1=1' : '(c.applicantId = :uid OR c.ownerId = :uid)', { uid: user.id })
        .getCount();
    }

    const pendingApproval = await this.approvalRepo
      .createQueryBuilder('af')
      .where('af.approverId = :uid AND af.status = :st', { uid: user.id, st: ApprovalStatus.PENDING })
      .getCount();

    const totalAmount = await this.contractRepo.createQueryBuilder('c')
      .select('COALESCE(SUM(c.amount), 0)', 'sum')
      .where(isAdmin ? '1=1' : '(c.applicantId = :uid OR c.ownerId = :uid)', { uid: user.id })
      .getRawOne();

    return {
      total,
      byStatus,
      pendingApproval,
      totalAmount: parseFloat(totalAmount.sum || 0),
    };
  }

  async getResourcesUsage() {
    const resources = await this.fileResourceRepo
      .createQueryBuilder('fr')
      .orderBy('fr.size', 'DESC')
      .take(50)
      .getMany();

    const totalSize = await this.fileResourceRepo.createQueryBuilder('fr')
      .select('COALESCE(SUM(fr.size), 0)', 'sum')
      .getRawOne();

    const locked = resources.filter((r) => r.isLocked);

    return {
      totalCount: resources.length,
      totalSize: parseFloat(totalSize.sum || 0),
      lockedCount: locked.length,
      resources,
      byType: resources.reduce((acc, r) => {
        acc[r.resourceType] = (acc[r.resourceType] || 0) + Number(r.size || 0);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  async lockResource(resourceId: string, userId: string, userName: string, lockHours = 2) {
    const resource = await this.fileResourceRepo.findOne({ where: { id: resourceId } });
    if (!resource) throw new NotFoundException('资源不存在');
    if (resource.isLocked && new Date() < new Date(resource.lockExpireAt)) {
      throw new ForbiddenException(`资源被 ${resource.lockerName} 锁定中，到 ${resource.lockExpireAt} 过期`);
    }
    resource.isLocked = true;
    resource.lockerId = userId;
    resource.lockerName = userName;
    resource.lockedAt = new Date();
    resource.lockExpireAt = new Date(Date.now() + lockHours * 60 * 60 * 1000);
    return this.fileResourceRepo.save(resource);
  }

  async unlockResource(resourceId: string, userId: string) {
    const resource = await this.fileResourceRepo.findOne({ where: { id: resourceId } });
    if (!resource) throw new NotFoundException('资源不存在');
    if (resource.lockerId !== userId) {
      throw new ForbiddenException('只能解锁自己的锁定');
    }
    resource.isLocked = false;
    resource.lockerId = null;
    resource.lockerName = null;
    resource.lockedAt = null;
    resource.lockExpireAt = null;
    return this.fileResourceRepo.save(resource);
  }

  async verifyMaterials(contractId: string, verified: boolean, remark: string, user: CurrentUserPayload) {
    const contract = await this.getContract(contractId);
    contract.materialsComplete = verified;
    const saved = await this.contractRepo.save(contract);

    await this.notificationService.createNotification({
      recipientId: contract.applicantId,
      type: verified ? 'material_complete' : 'material_incomplete',
      channel: 'in_app',
      title: verified ? '材料核对通过' : '材料核对未通过',
      content: `【${contract.contractNo}】材料核对${verified ? '已通过' : '未通过'}。${remark}`,
      relatedData: { contractId },
    });

    await this.addAuditLog(user.id, user.realName, AuditAction.APPROVE, 'contract_material', contractId, contract.title, null, { verified, remark });
    return saved;
  }

  async archiveContract(contractId: string, user: CurrentUserPayload) {
    const contract = await this.getContract(contractId);
    this.checkPermission(contract, user, ['contract:archive']);

    if (contract.status !== ContractStatus.SIGNED && contract.status !== ContractStatus.APPROVED) {
      throw new BadRequestException('仅已签署或已批准的合同可以归档');
    }

    contract.status = ContractStatus.ARCHIVED;
    contract.archivedAt = new Date();
    const saved = await this.contractRepo.save(contract);

    await this.addAuditLog(user.id, user.realName, AuditAction.ARCHIVE, 'contract', saved.id, saved.title, null, null);
    return saved;
  }

  private checkPermission(contract: Contract, user: CurrentUserPayload, requiredPerms: string[]) {
    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    const isOwner = contract.applicantId === user.id || contract.ownerId === user.id;
    const hasPerm = requiredPerms.every((p) => user.permissions?.includes(p));

    if (!isAdmin && !isOwner && !hasPerm) {
      throw new ForbiddenException('无权操作此合同');
    }
  }

  private async addAuditLog(userId: string, userName: string, action: AuditAction, targetType: string, targetId: string, targetName?: string, beforeData?: any, afterData?: any, remark?: string) {
    try {
      const log = this.auditLogRepo.create({ userId, userName, action, targetType, targetId, targetName, beforeData, afterData, remark });
      await this.auditLogRepo.save(log);
    } catch (e) {}
  }
}
