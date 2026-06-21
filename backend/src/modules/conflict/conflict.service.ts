import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { ConflictRecord, ConflictStatus, ConflictSeverity, ConflictType } from '../../entities/conflict-record.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { NotificationService } from '../notification/notification.service';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface CreateConflictDto {
  contractId?: string;
  title: string;
  description: string;
  conflictType?: ConflictType;
  severity?: ConflictSeverity;
  impactScope?: string;
  affectedResources?: string;
  nextSteps?: string;
  handlerId?: string;
}

export interface UpdateConflictDto {
  title?: string;
  description?: string;
  status?: ConflictStatus;
  severity?: ConflictSeverity;
  impactScope?: string;
  handlerId?: string;
  affectedResources?: string;
  nextSteps?: string;
  resolution?: string;
  timelineNote?: string;
}

export interface QueryConflictDto {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: ConflictStatus;
  severity?: ConflictSeverity;
  conflictType?: ConflictType;
  handlerId?: string;
  reporterId?: string;
  contractId?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
}

@Injectable()
export class ConflictService {
  constructor(
    @InjectRepository(ConflictRecord) private conflictRepo: Repository<ConflictRecord>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
    private notificationService: NotificationService,
  ) {}

  async createConflict(dto: CreateConflictDto, user: CurrentUserPayload) {
    const conflict = this.conflictRepo.create({
      ...dto,
      reporterId: user.id,
      timeline: [
        {
          time: new Date(),
          actor: user.realName,
          action: '创建冲突记录',
          remark: dto.description.substring(0, 200),
        },
      ],
    });
    const saved = await this.conflictRepo.save(conflict);

    if (dto.handlerId) {
      await this.notificationService.createNotification({
        recipientId: dto.handlerId,
        type: 'conflict_created',
        channel: 'in_app',
        title: `被指派处理冲突: ${dto.title}`,
        content: `严重程度: ${dto.severity || 'MEDIUM'}\n影响范围: ${dto.impactScope || '未说明'}\n${dto.description}`,
        relatedData: { conflictId: saved.id },
      });
    }

    await this.addAuditLog(user.id, user.realName, AuditAction.CONFLICT_REPORT, 'conflict', saved.id, saved.title);
    return saved;
  }

  async getConflict(id: string) {
    const conflict = await this.conflictRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contract', 'contract')
      .leftJoinAndSelect('c.handler', 'handler')
      .leftJoinAndSelect('c.reporter', 'reporter')
      .where('c.id = :id', { id })
      .getOne();

    if (!conflict) throw new NotFoundException('冲突记录不存在');
    return conflict;
  }

  async updateConflict(id: string, dto: UpdateConflictDto, user: CurrentUserPayload) {
    const conflict = await this.getConflict(id);
    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    const isHandler = conflict.handlerId === user.id;
    const isReporter = conflict.reporterId === user.id;

    if (!isAdmin && !isHandler && !isReporter) {
      throw new ForbiddenException('无权操作此冲突记录');
    }

    const beforeData = JSON.parse(JSON.stringify(conflict));
    const tl = conflict.timeline || [];

    if (dto.status && dto.status !== conflict.status) {
      const statusNames: Record<string, string> = {
        open: '待处理', assigned: '已指派', resolving: '处理中',
        resolved: '已解决', escalated: '已升级', closed: '已关闭',
      };
      tl.push({
        time: new Date(),
        actor: user.realName,
        action: `状态变更: ${statusNames[conflict.status] || conflict.status} → ${statusNames[dto.status] || dto.status}`,
        remark: dto.timelineNote || '',
      });
      if (dto.status === ConflictStatus.RESOLVED) {
        conflict.resolvedAt = new Date();
      }
    }

    if (dto.handlerId && dto.handlerId !== conflict.handlerId) {
      tl.push({
        time: new Date(),
        actor: user.realName,
        action: '指派处理人',
        remark: `处理人ID: ${dto.handlerId}`,
      });
      await this.notificationService.createNotification({
        recipientId: dto.handlerId,
        type: 'conflict_created',
        channel: 'in_app',
        title: `被指派处理冲突: ${conflict.title}`,
        content: `${user.realName} 将此冲突转交给您处理。\n严重程度: ${conflict.severity}\n影响范围: ${conflict.impactScope || '未说明'}`,
        relatedData: { conflictId: conflict.id },
      });
    }

    if (dto.nextSteps) {
      tl.push({
        time: new Date(),
        actor: user.realName,
        action: '更新下一步计划',
        remark: dto.nextSteps.substring(0, 200),
      });
    }
    if (dto.resolution) {
      tl.push({
        time: new Date(),
        actor: user.realName,
        action: '记录解决方案',
        remark: dto.resolution.substring(0, 200),
      });
    }
    if (dto.timelineNote && !dto.status && !dto.handlerId && !dto.nextSteps && !dto.resolution) {
      tl.push({
        time: new Date(),
        actor: user.realName,
        action: '添加备注',
        remark: dto.timelineNote,
      });
    }

    const { timelineNote, ...updateData } = dto;
    Object.assign(conflict, updateData, { timeline: tl });

    const saved = await this.conflictRepo.save(conflict);

    if (dto.status === ConflictStatus.RESOLVED && conflict.reporterId) {
      await this.notificationService.createNotification({
        recipientId: conflict.reporterId,
        type: 'conflict_resolved',
        channel: 'in_app',
        title: `冲突已解决: ${conflict.title}`,
        content: `解决方案: ${dto.resolution || conflict.resolution || '查看详情'}\n处理人: ${user.realName}`,
        relatedData: { conflictId: conflict.id },
      });
    }

    await this.addAuditLog(user.id, user.realName, AuditAction.CONFLICT_RESOLVE, 'conflict', saved.id, saved.title, beforeData, updateData);
    return saved;
  }

  async queryConflicts(query: QueryConflictDto, user: CurrentUserPayload) {
    const { page = 1, pageSize = 20, keyword, status, severity, conflictType, handlerId, reporterId, contractId, dateRangeStart, dateRangeEnd } = query;

    const qb = this.conflictRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.contract', 'contract')
      .leftJoinAndSelect('c.handler', 'handler')
      .leftJoinAndSelect('c.reporter', 'reporter');

    if (keyword) {
      qb.andWhere(
        new Brackets((sq) => {
          sq.where('c.title ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.description ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.impactScope ILIKE :kw', { kw: `%${keyword}%` })
            .orWhere('c.resolution ILIKE :kw', { kw: `%${keyword}%` });
        }),
      );
    }
    if (status) qb.andWhere('c.status = :st', { st: status });
    if (severity) qb.andWhere('c.severity = :sv', { sv: severity });
    if (conflictType) qb.andWhere('c.conflictType = :ct', { ct: conflictType });
    if (handlerId) qb.andWhere('c.handlerId = :hid', { hid: handlerId });
    if (reporterId) qb.andWhere('c.reporterId = :rid', { rid: reporterId });
    if (contractId) qb.andWhere('c.contractId = :cid', { cid: contractId });
    if (dateRangeStart) qb.andWhere('c.createdAt >= :ds', { ds: dateRangeStart });
    if (dateRangeEnd) qb.andWhere('c.createdAt <= :de', { de: dateRangeEnd });

    const isAdmin = user.roles?.includes('super_admin') || user.roles?.includes('legal_admin');
    if (!isAdmin) {
      qb.andWhere(new Brackets((sq) => {
        sq.where('c.reporterId = :uid', { uid: user.id })
          .orWhere('c.handlerId = :uid', { uid: user.id });
      }));
    }

    qb.addSelect(`
      CASE c.severity
        WHEN 'critical' THEN 0
        WHEN 'high' THEN 1
        WHEN 'medium' THEN 2
        WHEN 'low' THEN 3
        ELSE 4
      END
    `, 'severity_order');
    
    qb.orderBy('severity_order', 'ASC').addOrderBy('c.createdAt', 'DESC');

    qb.skip((page - 1) * pageSize).take(pageSize);

    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async getStats() {
    const total = await this.conflictRepo.count();
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    for (const s of Object.values(ConflictStatus)) {
      byStatus[s] = await this.conflictRepo.count({ where: { status: s } });
    }
    for (const s of Object.values(ConflictSeverity)) {
      bySeverity[s] = await this.conflictRepo.count({ where: { severity: s } });
    }

    return { total, byStatus, bySeverity };
  }

  private async addAuditLog(userId: string, userName: string, action: AuditAction, targetType: string, targetId: string, targetName?: string, beforeData?: any, afterData?: any) {
    try {
      const log = this.auditLogRepo.create({ userId, userName, action, targetType, targetId, targetName, beforeData, afterData });
      await this.auditLogRepo.save(log);
    } catch (e) {}
  }
}
