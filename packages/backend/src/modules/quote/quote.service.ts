import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, In } from 'typeorm';
import { Quote, QuoteStatus, ProfitWarningLevel } from '../../entities/quote.entity';
import { QuoteVersion } from '../../entities/quote-version.entity';
import { User, UserRole } from '../../entities/user.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../../entities/notification.entity';
import { CustomerRequirement } from '../../entities/customer-requirement.entity';

export const MIN_PROFIT_MARGIN_WARNING = 10;
export const MIN_PROFIT_MARGIN_CRITICAL = 5;

@Injectable()
export class QuoteService {
  constructor(
    @InjectRepository(Quote)
    private quoteRepository: Repository<Quote>,
    @InjectRepository(QuoteVersion)
    private quoteVersionRepository: Repository<QuoteVersion>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(CustomerRequirement)
    private requirementRepository: Repository<CustomerRequirement>,
    private notificationService: NotificationService,
  ) {}

  async findAll(
    user: User,
    filters?: {
      status?: QuoteStatus;
      requirementId?: string;
      keyword?: string;
      createdBy?: string;
      profitWarning?: ProfitWarningLevel;
    },
    page = 1,
    limit = 20,
  ): Promise<{ data: Quote[]; total: number; page: number; limit: number }> {
    const options: FindManyOptions<Quote> = {
      relations: ['requirement', 'approvedBy'],
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

    if (filters?.requirementId) {
      options.where['requirementId'] = filters.requirementId;
    }

    if (filters?.profitWarning) {
      options.where['profitWarning'] = filters.profitWarning;
    }

    const [data, total] = await this.quoteRepository.findAndCount(options);
    return { data, total, page, limit };
  }

  async findById(id: string, user?: User): Promise<Quote> {
    const quote = await this.quoteRepository.findOne({
      where: { id },
      relations: ['requirement', 'versions', 'approvedBy', 'contract'],
    });

    if (!quote) {
      throw new NotFoundException('报价单不存在');
    }

    if (user && user.role === UserRole.SALES && quote.createdBy !== user.id) {
      throw new ForbiddenException('无权访问此报价单');
    }

    return quote;
  }

  async create(requirementId: string, user: User, templateId?: string): Promise<Quote> {
    const requirement = await this.requirementRepository.findOne({ where: { id: requirementId } });
    if (!requirement) {
      throw new NotFoundException('客户需求不存在');
    }

    const quote = this.quoteRepository.create({
      requirementId,
      createdBy: user.id,
      updatedBy: user.id,
      version: 1,
      status: QuoteStatus.DRAFT,
      hotels: [],
      transportation: [],
      tickets: [],
      meals: [],
      guides: [],
      otherExpenses: [],
      itineraryName: `${requirement.destination}定制行程`,
    });

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.CREATE, user, null, JSON.stringify(saved));
    return saved;
  }

  async update(id: string, data: Partial<Quote>, user: User, changeDescription?: string): Promise<Quote> {
    const quote = await this.findById(id, user);

    if (![QuoteStatus.DRAFT, QuoteStatus.REJECTED].includes(quote.status)) {
      throw new ForbiddenException('当前状态无法修改报价单');
    }

    const oldSnapshot = this.createSnapshot(quote);

    if (data.hotels) quote.hotels = data.hotels;
    if (data.transportation) quote.transportation = data.transportation;
    if (data.tickets) quote.tickets = data.tickets;
    if (data.meals) quote.meals = data.meals;
    if (data.guides) quote.guides = data.guides;
    if (data.otherExpenses) quote.otherExpenses = data.otherExpenses;
    if (data.serviceFee !== undefined) quote.serviceFee = Number(data.serviceFee);
    if (data.itineraryName) quote.itineraryName = data.itineraryName;
    if (data.travelStartDate) quote.travelStartDate = data.travelStartDate;
    if (data.travelEndDate) quote.travelEndDate = data.travelEndDate;
    if (data.remarks) quote.remarks = data.remarks;

    this.calculateTotals(quote);
    quote.updatedBy = user.id;

    if (quote.version > 1) {
      await this.saveVersion(quote, oldSnapshot, user, changeDescription);
    }

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.UPDATE, user, JSON.stringify(oldSnapshot), JSON.stringify(this.createSnapshot(saved)));
    return saved;
  }

  async submitForApproval(id: string, user: User): Promise<Quote> {
    const quote = await this.findById(id, user);

    if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.REJECTED) {
      throw new ForbiddenException('只有草稿或被拒绝状态才能提交审批');
    }

    this.calculateTotals(quote);

    if (quote.profitWarning === ProfitWarningLevel.CRITICAL) {
      throw new BadRequestException('毛利率过低，无法提交审批，请调整报价');
    }

    const oldSnapshot = this.createSnapshot(quote);
    quote.status = QuoteStatus.PENDING_APPROVAL;
    quote.updatedBy = user.id;

    if (quote.version > 1) {
      await this.saveVersion(quote, oldSnapshot, user, '提交审批');
    }

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.SUBMIT, user, QuoteStatus.DRAFT, QuoteStatus.PENDING_APPROVAL);

    const supervisors = await this.getSupervisors();
    for (const supervisor of supervisors) {
      await this.notificationService.create({
        recipientId: supervisor.id,
        type: NotificationType.QUOTE_APPROVAL,
        title: quote.profitWarning === ProfitWarningLevel.WARNING ? '【毛利预警】报价单待审批' : '报价单待审批',
        content: `报价单「${saved.itineraryName}」等待您的审批，毛利率：${saved.profitMargin}%`,
        relatedData: {
          entityType: 'Quote',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  async approve(id: string, user: User, comments?: string): Promise<Quote> {
    const quote = await this.findById(id);

    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(user.role)) {
      throw new ForbiddenException('无权审批报价单');
    }

    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('当前状态无法审批');
    }

    quote.status = QuoteStatus.APPROVED;
    quote.approvedById = user.id;
    quote.approvedAt = new Date();
    quote.approvalComments = comments;
    quote.updatedBy = user.id;

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.APPROVE, user, QuoteStatus.PENDING_APPROVAL, QuoteStatus.APPROVED);

    if (quote.createdBy && quote.createdBy !== user.id) {
      await this.notificationService.create({
        recipientId: quote.createdBy,
        type: NotificationType.STATUS_CHANGE,
        title: '报价单已通过审批',
        content: `您的报价单「${saved.itineraryName}」已通过审批`,
        relatedData: {
          entityType: 'Quote',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  async reject(id: string, user: User, comments: string): Promise<Quote> {
    const quote = await this.findById(id);

    if (![UserRole.ADMIN, UserRole.SUPERVISOR].includes(user.role)) {
      throw new ForbiddenException('无权拒绝报价单');
    }

    if (quote.status !== QuoteStatus.PENDING_APPROVAL) {
      throw new ForbiddenException('当前状态无法审批');
    }

    quote.status = QuoteStatus.REJECTED;
    quote.approvedById = user.id;
    quote.approvedAt = new Date();
    quote.approvalComments = comments;
    quote.updatedBy = user.id;

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.REJECT, user, QuoteStatus.PENDING_APPROVAL, QuoteStatus.REJECTED);

    if (quote.createdBy && quote.createdBy !== user.id) {
      await this.notificationService.create({
        recipientId: quote.createdBy,
        type: NotificationType.STATUS_CHANGE,
        title: '报价单被拒绝',
        content: `您的报价单「${saved.itineraryName}」被拒绝，原因：${comments}`,
        relatedData: {
          entityType: 'Quote',
          entityId: saved.id,
        },
      });
    }

    return saved;
  }

  async sendToCustomer(id: string, user: User): Promise<Quote> {
    const quote = await this.findById(id, user);

    if (quote.status !== QuoteStatus.APPROVED) {
      throw new ForbiddenException('只有已通过审批的报价单才能发送给客户');
    }

    quote.status = QuoteStatus.SENT_TO_CUSTOMER;
    quote.sentToCustomerAt = new Date();
    quote.updatedBy = user.id;

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.SEND, user, QuoteStatus.APPROVED, QuoteStatus.SENT_TO_CUSTOMER);

    return saved;
  }

  async customerResponse(id: string, accepted: boolean, user: User): Promise<Quote> {
    const quote = await this.findById(id, user);

    if (quote.status !== QuoteStatus.SENT_TO_CUSTOMER) {
      throw new ForbiddenException('当前状态无法进行客户响应');
    }

    quote.status = accepted ? QuoteStatus.ACCEPTED : QuoteStatus.DECLINED;
    quote.customerResponseAt = new Date();
    quote.updatedBy = user.id;

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.STATUS_CHANGE, user, QuoteStatus.SENT_TO_CUSTOMER, quote.status);

    return saved;
  }

  async createNewVersion(id: string, user: User, changeDescription: string): Promise<Quote> {
    const quote = await this.findById(id, user);

    const oldSnapshot = this.createSnapshot(quote);
    quote.version += 1;
    quote.status = QuoteStatus.DRAFT;
    quote.updatedBy = user.id;

    await this.saveVersion(quote, oldSnapshot, user, changeDescription);

    const saved = await this.quoteRepository.save(quote);
    await this.createAuditLog(saved.id, AuditAction.UPDATE, user, JSON.stringify(oldSnapshot), JSON.stringify(this.createSnapshot(saved)));
    return saved;
  }

  async getVersions(id: string, user: User): Promise<QuoteVersion[]> {
    const quote = await this.findById(id, user);
    return this.quoteVersionRepository.find({
      where: { quoteId: id },
      relations: ['modifiedBy'],
      order: { version: 'DESC' },
    });
  }

  async compareVersions(id: string, version1: number, version2: number, user: User): Promise<any> {
    const versions = await this.quoteVersionRepository.find({
      where: { quoteId: id, version: In([version1, version2]) },
    });

    if (versions.length !== 2) {
      throw new NotFoundException('找不到指定的版本');
    }

    const v1 = versions.find(v => v.version === version1);
    const v2 = versions.find(v => v.version === version2);

    return {
      version1: v1.snapshot,
      version2: v2.snapshot,
      differences: this.findDifferences(v1.snapshot, v2.snapshot),
    };
  }

  private calculateTotals(quote: Quote): void {
    let totalCost = 0;

    if (quote.hotels) {
      quote.hotels.forEach(h => {
        h.totalCost = Number(h.nights) * Number(h.costPerNight);
        totalCost += h.totalCost;
      });
    }

    if (quote.transportation) {
      quote.transportation.forEach(t => {
        t.totalCost = Number(t.days) * Number(t.costPerDay);
        totalCost += t.totalCost;
      });
    }

    if (quote.tickets) {
      quote.tickets.forEach(t => {
        t.totalCost = Number(t.quantity) * Number(t.costPerTicket);
        totalCost += t.totalCost;
      });
    }

    if (quote.meals) {
      quote.meals.forEach(m => {
        m.totalCost = Number(m.count) * Number(m.costPerPerson);
        totalCost += m.totalCost;
      });
    }

    if (quote.guides) {
      quote.guides.forEach(g => {
        g.totalCost = Number(g.days) * Number(g.costPerDay);
        totalCost += g.totalCost;
      });
    }

    if (quote.otherExpenses) {
      quote.otherExpenses.forEach(o => {
        totalCost += Number(o.amount);
      });
    }

    quote.totalCost = totalCost;
    quote.totalPrice = totalCost + Number(quote.serviceFee || 0);
    quote.profit = Number(quote.serviceFee || 0);
    quote.profitMargin = quote.totalPrice > 0 ? (quote.profit / quote.totalPrice) * 100 : 0;

    if (quote.profitMargin < MIN_PROFIT_MARGIN_CRITICAL) {
      quote.profitWarning = ProfitWarningLevel.CRITICAL;
    } else if (quote.profitMargin < MIN_PROFIT_MARGIN_WARNING) {
      quote.profitWarning = ProfitWarningLevel.WARNING;
    } else {
      quote.profitWarning = ProfitWarningLevel.NORMAL;
    }
  }

  private createSnapshot(quote: Quote): any {
    return {
      hotels: JSON.parse(JSON.stringify(quote.hotels || [])),
      transportation: JSON.parse(JSON.stringify(quote.transportation || [])),
      tickets: JSON.parse(JSON.stringify(quote.tickets || [])),
      meals: JSON.parse(JSON.stringify(quote.meals || [])),
      guides: JSON.parse(JSON.stringify(quote.guides || [])),
      otherExpenses: JSON.parse(JSON.stringify(quote.otherExpenses || [])),
      totalCost: quote.totalCost,
      serviceFee: quote.serviceFee,
      totalPrice: quote.totalPrice,
      profit: quote.profit,
      profitMargin: quote.profitMargin,
      remarks: quote.remarks,
    };
  }

  private async saveVersion(quote: Quote, snapshot: any, user: User, changeDescription?: string): Promise<void> {
    const version = this.quoteVersionRepository.create({
      quoteId: quote.id,
      version: quote.version - 1,
      snapshot,
      changeDescription,
      modifiedById: user.id,
    });
    await this.quoteVersionRepository.save(version);
  }

  private async createAuditLog(
    entityId: string,
    action: AuditAction,
    user: User,
    oldValue: string | null,
    newValue: string | null,
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      entityType: 'Quote',
      entityId,
      action,
      oldValue,
      newValue,
      userId: user.id,
    });
    await this.auditLogRepository.save(auditLog);
  }

  private async getSupervisors(): Promise<User[]> {
    const UserEntity = (await import('../../entities/user.entity')).User;
    const userRepo = this.quoteRepository.manager.getRepository(UserEntity);
    return userRepo.find({
      where: { role: In([UserRole.ADMIN, UserRole.SUPERVISOR]) },
    });
  }

  private findDifferences(obj1: any, obj2: any): any {
    const differences = {};
    for (const key of Object.keys(obj1)) {
      if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        differences[key] = { old: obj1[key], new: obj2[key] };
      }
    }
    return differences;
  }
}


