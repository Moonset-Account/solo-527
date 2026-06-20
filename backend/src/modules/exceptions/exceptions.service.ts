import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { ExceptionRecord } from './entities/exception-record.entity';
import { CreateExceptionDto, AssignExceptionDto, UpdateExceptionStatusDto, SubmitConclusionDto, CloseExceptionDto, UpdateRefundDto, QueryExceptionsDto } from './dto/exception.dto';
import { ExceptionType, ExceptionStatus, ExceptionPriority, RefundStatus } from '../../common/enums/exception.enum';
import { UserRole } from '../../common/enums/user.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ExceptionsService {
  constructor(
    @InjectRepository(ExceptionRecord)
    private exceptionsRepository: Repository<ExceptionRecord>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private generateExceptionNo(): string {
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0') +
      date.getHours().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EXP${dateStr}${random}`;
  }

  async create(dto: CreateExceptionDto, reporterId: string, reporterName: string) {
    const record = this.exceptionsRepository.create({
      ...dto,
      exceptionNo: this.generateExceptionNo(),
      status: ExceptionStatus.OPEN,
      priority: dto.priority || ExceptionPriority.MEDIUM,
      reporterId,
      reporterName: dto.reporterName || reporterName,
      refundStatus: dto.refundRequestedAmount ? RefundStatus.REQUESTED : RefundStatus.NONE,
      refundRequestedAmount: dto.refundRequestedAmount || 0,
      followUpCount: 0,
      createdBy: reporterId,
    });

    const saved = await this.exceptionsRepository.save(record);

    if (saved.type === ExceptionType.REFUND) {
      await this.updateRefund(saved.id, {
        refundStatus: RefundStatus.REQUESTED,
        refundRequestedAmount: dto.refundRequestedAmount || 0,
        refundReason: dto.refundReason,
        refundEvidence: dto.refundEvidence,
      }, reporterId);
    }

    return this.findOne(saved.id);
  }

  async findAll(query: QueryExceptionsDto, userId?: string, userRole?: string) {
    const { type, status, priority, refundStatus, orderId, handlerId, startDate, endDate, keyword, page, pageSize } = query;
    const p = parseInt(page, 10) || 1;
    const ps = parseInt(pageSize, 10) || 20;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (refundStatus) where.refundStatus = refundStatus;
    if (orderId) where.orderId = orderId;
    if (handlerId) where.handlerId = handlerId;
    if (startDate && endDate) where.createdAt = Between(new Date(startDate), new Date(endDate));

    if (userRole === UserRole.BLOGGER && userId) {
      where.handlerId = userId;
    }

    let queryBuilder = this.exceptionsRepository.createQueryBuilder('e')
      .leftJoinAndSelect('e.reporter', 'reporter')
      .leftJoinAndSelect('e.handler', 'handler')
      .where(where);

    if (keyword) {
      queryBuilder.andWhere('(e.title ILIKE :keyword OR e.description ILIKE :keyword OR e.exceptionNo ILIKE :keyword)', { keyword: `%${keyword}%` });
    }

    const [list, total] = await queryBuilder
      .orderBy('e.priority', 'DESC')
      .addOrderBy('e.createdAt', 'DESC')
      .skip((p - 1) * ps)
      .take(ps)
      .getManyAndCount();

    return { list, total, page: p, pageSize: ps };
  }

  async findOne(id: string) {
    const record = await this.exceptionsRepository.findOne({
      where: { id },
      relations: ['reporter', 'handler', 'order', 'attachments'],
    });
    if (!record) throw new NotFoundException('异常记录不存在');
    return record;
  }

  async assign(id: string, dto: AssignExceptionDto, operatorId: string, operatorRole: string) {
    if (operatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以分配异常处理人');
    }

    const handler = await this.usersRepository.findOne({ where: { id: dto.handlerId } });
    if (!handler) throw new NotFoundException('处理人不存在');
    if (handler.role !== UserRole.BLOGGER && handler.role !== UserRole.ADMIN) {
      throw new BadRequestException('处理人必须是知识博主或管理员');
    }

    const record = await this.findOne(id);
    record.handlerId = dto.handlerId;
    record.status = ExceptionStatus.ASSIGNED;
    record.assignedAt = new Date();
    record.updatedBy = operatorId;
    record.followUpCount = record.followUpCount + 1;

    return this.exceptionsRepository.save(record);
  }

  async updateStatus(id: string, dto: UpdateExceptionStatusDto, userId: string, userRole: string) {
    const record = await this.findOne(id);
    if (userRole !== UserRole.ADMIN && record.handlerId !== userId) {
      throw new ForbiddenException('无权修改此异常状态');
    }

    record.status = dto.status;
    record.updatedBy = userId;
    if (dto.status === ExceptionStatus.PENDING_REVIEW && record.handlerId) {
      record.handlerId = record.handlerId;
    }
    record.followUpCount = record.followUpCount + 1;

    return this.exceptionsRepository.save(record);
  }

  async submitConclusion(id: string, dto: SubmitConclusionDto, userId: string, userRole: string) {
    const record = await this.findOne(id);
    if (userRole !== UserRole.ADMIN && record.handlerId !== userId) {
      throw new ForbiddenException('只有处理人可以提交结论');
    }

    record.handlerConclusion = dto.handlerConclusion;
    record.processingNotes = dto.processingNotes || record.processingNotes;
    record.status = ExceptionStatus.PENDING_REVIEW;
    record.resolvedAt = new Date();
    record.updatedBy = userId;
    record.followUpCount = record.followUpCount + 1;

    return this.exceptionsRepository.save(record);
  }

  async updateRefund(id: string, dto: UpdateRefundDto, operatorId: string) {
    const record = await this.findOne(id);
    if (record.type !== ExceptionType.REFUND) {
      throw new BadRequestException('非退款类型异常');
    }

    record.refundStatus = dto.refundStatus;
    if (dto.refundRequestedAmount !== undefined) record.refundRequestedAmount = dto.refundRequestedAmount;
    if (dto.refundApprovedAmount !== undefined) record.refundApprovedAmount = dto.refundApprovedAmount;
    if (dto.refundActualAmount !== undefined) record.refundActualAmount = dto.refundActualAmount;
    if (dto.refundReason) record.refundReason = dto.refundReason;
    if (dto.refundEvidence) record.refundEvidence = dto.refundEvidence;
    record.updatedBy = operatorId;

    return this.exceptionsRepository.save(record);
  }

  async close(id: string, dto: CloseExceptionDto, operatorId: string, operatorRole: string) {
    if (operatorRole !== UserRole.ADMIN) {
      throw new ForbiddenException('只有管理员可以关闭异常');
    }

    const record = await this.findOne(id);
    if (record.status === ExceptionStatus.CLOSED || record.status === ExceptionStatus.RESOLVED) {
      throw new BadRequestException('该异常已关闭');
    }
    if (!record.handlerConclusion && record.handlerId) {
      throw new BadRequestException('处理人未提交结论，不能关闭');
    }

    record.closingExplanation = dto.closingExplanation;
    record.status = ExceptionStatus.CLOSED;
    record.closedAt = new Date();
    record.closedBy = operatorId;
    record.updatedBy = operatorId;

    if (dto.refundStatus) record.refundStatus = dto.refundStatus;
    if (dto.refundApprovedAmount !== undefined) record.refundApprovedAmount = dto.refundApprovedAmount;
    if (dto.refundActualAmount !== undefined) record.refundActualAmount = dto.refundActualAmount;

    record.followUpCount = record.followUpCount + 1;

    return this.exceptionsRepository.save(record);
  }

  async addFollowUp(id: string, note: string, operatorId: string) {
    const record = await this.findOne(id);
    record.processingNotes = (record.processingNotes || '') +
      `\n[${new Date().toLocaleString()}] ${note}`;
    record.followUpCount = record.followUpCount + 1;
    record.updatedBy = operatorId;
    return this.exceptionsRepository.save(record);
  }

  async getStatistics() {
    const all = await this.exceptionsRepository.find();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    all.forEach((r) => {
      byType[r.type] = (byType[r.type] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      byPriority[r.priority] = (byPriority[r.priority] || 0) + 1;
    });

    return {
      total: all.length,
      byType,
      byStatus,
      byPriority,
      refundTotal: all.filter((r) => r.type === ExceptionType.REFUND).length,
      refundPending: all.filter((r) => r.type === ExceptionType.REFUND && r.refundStatus !== RefundStatus.REFUNDED && r.refundStatus !== RefundStatus.REJECTED && r.refundStatus !== RefundStatus.NONE).length,
    };
  }
}
