import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractStatus } from '../../entities/contract.entity';
import { Quote, QuoteStatus } from '../../entities/quote.entity';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';

@Injectable()
export class ContractService {
  constructor(
    @InjectRepository(Contract)
    private contractRepository: Repository<Contract>,
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private notificationService: NotificationService,
  ) {}

  async findAll(
    user: User,
    filters?: {
      status?: ContractStatus;
      keyword?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const where: any = {};

    if (user.role === UserRole.SALES) {
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.contractRepository.findAndCount({
      where,
      relations: ['quote', 'approvedBy', 'companySignatory'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findById(id: string, user?: User): Promise<Contract> {
    const contract = await this.contractRepository.findOne({
      where: { id },
      relations: ['quote', 'approvedBy', 'companySignatory'],
    });

    if (!contract) {
      throw new NotFoundException('合同不存在');
    }

    return contract;
  }

  async create(quoteId: string, user: User): Promise<Contract> {
    const quote = await this.quoteRepository.findOne({
      where: { id: quoteId },
      relations: ['requirement'],
    });

    if (!quote) {
      throw new NotFoundException('报价单不存在');
    }

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new ForbiddenException('只有已确认的报价单才能生成合同');
    }

    const contractNumber = await this.generateContractNumber();
    
    const contract = this.contractRepository.create({
      contractNumber,
      quoteId,
      customerName: quote.requirement.customerName,
      status: ContractStatus.DRAFT,
      paymentTerms: this.generateDefaultPaymentTerms(quote.totalPrice),
      createdBy: user.id,
      updatedBy: user.id,
    });

    const saved = await this.contractRepository.save(contract);
    await this.createAuditLog(saved.id, AuditAction.CREATE, user, null, JSON.stringify(saved));
    return saved;
  }

  async submitForApproval(id: string, user: User): Promise<Contract> {
    const contract = await this.findById(id, user);

    if (contract.status !== ContractStatus.DRAFT) {
      throw new ForbiddenException('只有草稿状态才能提交审批');
    }

    contract.status = ContractStatus.PENDING_APPROVAL;
    contract.updatedBy = user.id;

    const saved = await this.contractRepository.save(contract);
    await this.createAuditLog(saved.id, AuditAction.SUBMIT, user, ContractStatus.DRAFT, ContractStatus.PENDING_APPROVAL);

    return saved;
  }

  async approve(id: string, user: User, comments?: string): Promise<Contract> {
    const contract = await this.findById(id);

    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE].includes(user.role)) {
      throw new ForbiddenException('无权审批合同');
    }

    if (contract.status !== ContractStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('当前状态无法审批');
    }

    contract.status = ContractStatus.APPROVED;
    contract.approvedById = user.id;
    contract.approvedAt = new Date();
    contract.approvalComments = comments;
    contract.updatedBy = user.id;

    const saved = await this.contractRepository.save(contract);
    await this.createAuditLog(saved.id, AuditAction.APPROVE, user, ContractStatus.PENDING_APPROVAL, ContractStatus.APPROVED);

    if (contract.createdBy && contract.createdBy !== user.id) {
      await this.notificationService.create({
        recipientId: contract.createdBy,
        type: NotificationType.CONTRACT_APPROVAL,
        title: '合同已通过审批',
        content: `合同「${saved.contractNumber}」已通过审批`,
        relatedData: {
          entityType: 'Contract',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  async reject(id: string, user: User, comments: string): Promise<Contract> {
    const contract = await this.findById(id);

    if (![UserRole.ADMIN, UserRole.SUPERVISOR, UserRole.FINANCE].includes(user.role)) {
      throw new ForbiddenException('无权拒绝合同');
    }

    if (contract.status !== ContractStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('当前状态无法审批');
    }

    contract.status = ContractStatus.REJECTED;
    contract.approvedById = user.id;
    contract.approvedAt = new Date();
    contract.approvalComments = comments;
    contract.updatedBy = user.id;

    const saved = await this.contractRepository.save(contract);
    await this.createAuditLog(saved.id, AuditAction.REJECT, user, ContractStatus.PENDING_APPROVAL, ContractStatus.REJECTED);

    return saved;
  }

  async signContract(id: string, user: User, customerSignature: string): Promise<Contract> {
    const contract = await this.findById(id, user);

    if (contract.status !== ContractStatus.APPROVED) {
      throw new ForbiddenException('只有已审批的合同才能签署');
    }

    contract.status = ContractStatus.SIGNED;
    contract.customerSignature = customerSignature;
    contract.customerSignedAt = new Date();
    contract.companySignatoryId = user.id;
    contract.companySignedAt = new Date();
    contract.updatedBy = user.id;

    const saved = await this.contractRepository.save(contract);
    await this.createAuditLog(saved.id, AuditAction.STATUS_CHANGE, user, ContractStatus.APPROVED, ContractStatus.SIGNED);

    return saved;
  }

  private async generateContractNumber(): Promise<string> {
    const date = new Date();
    const prefix = `HT${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const lastContract = await this.contractRepository.findOne({
      where: { contractNumber: Repository().createQueryBuilder('contract')
        .where('contract.contractNumber LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('contract.contractNumber', 'DESC')
        .getQuery()
      },
      order: { contractNumber: 'DESC' },
    });

    let sequence = 1;
    if (lastContract) {
      const match = lastContract.contractNumber.match(/(\d{3})$/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}${String(sequence).padStart(3, '0')}`;
  }

  private generateDefaultPaymentTerms(totalAmount: number) {
    return [
      { stage: '定金', percentage: 30, amount: totalAmount * 0.3, paid: false },
      { stage: '中期款', percentage: 50, amount: totalAmount * 0.5, paid: false },
      { stage: '尾款', percentage: 20, amount: totalAmount * 0.2, paid: false },
    ];
  }

  private async createAuditLog(
    entityId: string,
    action: AuditAction,
    user: User,
    oldValue: string | null,
    newValue: string | null,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      entityType: 'Contract',
      entityId,
      action,
      oldValue,
      newValue,
      userId: user.id,
    });
    await this.auditLogRepository.save(auditLog);
  }
}
