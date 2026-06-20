import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Brackets } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import { CallbackLog, CallbackType, CallbackStatus } from '../../entities/callback-log.entity';
import { AuditLog, AuditAction } from '../../entities/audit-log.entity';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

export interface CreateCallbackDto {
  callbackType: CallbackType;
  targetUrl: string;
  httpMethod?: string;
  requestPayload?: Record<string, any> | string;
  requestHeaders?: Record<string, string>;
  relatedId?: string;
  relatedType?: string;
  maxRetryCount?: number;
}

export interface QueryCallbackDto {
  page?: number;
  pageSize?: number;
  keyword?: string;
  callbackType?: CallbackType;
  status?: CallbackStatus;
  relatedId?: string;
  relatedType?: string;
  dateRangeStart?: string;
  dateRangeEnd?: string;
  hasFailureReason?: boolean;
}

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    @InjectRepository(CallbackLog) private callbackRepo: Repository<CallbackLog>,
    @InjectRepository(AuditLog) private auditLogRepo: Repository<AuditLog>,
  ) {}

  async createCallback(dto: CreateCallbackDto, user?: CurrentUserPayload) {
    const firstAttemptAt = new Date();
    const log = this.callbackRepo.create({
      requestId: uuidv4(),
      callbackType: dto.callbackType,
      status: CallbackStatus.PENDING,
      targetUrl: dto.targetUrl,
      httpMethod: (dto.httpMethod || 'POST').toUpperCase(),
      requestPayload: typeof dto.requestPayload === 'string' ? dto.requestPayload : JSON.stringify(dto.requestPayload || {}),
      requestHeaders: dto.requestHeaders,
      maxRetryCount: dto.maxRetryCount ?? 5,
      relatedId: dto.relatedId,
      relatedType: dto.relatedType,
      triggeredBy: user?.id,
      firstAttemptAt,
      retryHistory: [],
    });
    const saved = await this.callbackRepo.save(log);
    setImmediate(() => this.executeCallback(saved.id));
    return saved;
  }

  async executeCallback(id: string) {
    const log = await this.callbackRepo.findOne({ where: { id } });
    if (!log) return;
    if (log.status === CallbackStatus.SUCCESS || log.status === CallbackStatus.CANCELLED) return;

    const attempt = (log.retryCount || 0) + 1;
    const startTime = Date.now();

    if (log.status !== CallbackStatus.PROCESSING) {
      log.status = CallbackStatus.PROCESSING;
      log.lastAttemptAt = new Date();
      if (!log.firstAttemptAt) log.firstAttemptAt = log.lastAttemptAt;
      await this.callbackRepo.save(log);
    }

    let responseStatusCode: number | null = null;
    let responseBody = '';
    let success = false;
    let failureReason = '';
    const history = log.retryHistory || [];

    try {
      const isMock = !process.env.REAL_CALLBACKS || log.targetUrl.includes('mock') || log.targetUrl.startsWith('notification://') || log.targetUrl.startsWith('payment://');
      if (isMock) {
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 500));
        const shouldFail = log.callbackType === CallbackType.PAYMENT ? Math.random() < 0.15 : Math.random() < 0.1;
        if (shouldFail) {
          responseStatusCode = 500;
          failureReason = 'Mock模拟调用失败';
          responseBody = JSON.stringify({ code: 500, message: failureReason, mock: true });
        } else {
          responseStatusCode = 200;
          responseBody = JSON.stringify({ code: 0, message: 'success', mock: true, data: { requestId: log.requestId } });
          success = true;
        }
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const resp = await fetch(log.targetUrl, {
            method: log.httpMethod as any,
            headers: { 'Content-Type': 'application/json', ...(log.requestHeaders || {}) },
            body: log.httpMethod !== 'GET' ? log.requestPayload : undefined,
            signal: controller.signal,
          });
          clearTimeout(timeout);
          responseStatusCode = resp.status;
          responseBody = await resp.text();
          success = resp.ok && (responseBody.includes('success') || responseBody.includes('code":0') || responseBody.includes('code": 0'));
          if (!success) failureReason = `HTTP ${resp.status}: ${responseBody.substring(0, 500)}`;
        } catch (err) {
          clearTimeout(timeout);
          if (err.name === 'AbortError') {
            failureReason = '请求超时(30秒)';
            responseStatusCode = 0;
          } else {
            failureReason = `请求异常: ${err.message}`;
            responseStatusCode = 0;
          }
        }
      }
    } catch (err) {
      failureReason = `回调执行异常: ${err.message}`;
    }

    const durationMs = Date.now() - startTime;
    history.push({
      attempt,
      time: new Date(),
      status: success ? 'success' : 'failed',
      statusCode: responseStatusCode,
      error: failureReason,
      durationMs,
    });

    log.retryCount = attempt;
    log.retryHistory = history;
    log.lastAttemptAt = new Date();
    log.durationMs = durationMs;
    log.responseStatusCode = responseStatusCode;
    log.responseBody = responseBody;

    if (success) {
      log.status = CallbackStatus.SUCCESS;
      log.completedAt = new Date();
      log.failureReason = null;
      log.nextRetryAt = null;
      this.logger.log(`✅ 回调成功: ${log.requestId} 类型=${log.callbackType} 耗时=${durationMs}ms`);
    } else {
      if (attempt >= (log.maxRetryCount || 5)) {
        log.status = CallbackStatus.FAILED;
        log.failureReason = failureReason || `已达最大重试次数(${attempt}次)`;
        log.nextRetryAt = null;
        this.logger.warn(`❌ 回调最终失败: ${log.requestId} 类型=${log.callbackType} 原因=${log.failureReason}`);
      } else {
        log.status = CallbackStatus.RETRYING;
        log.failureReason = failureReason;
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 3600 * 1000);
        log.nextRetryAt = new Date(Date.now() + delayMs);
        this.logger.warn(`🔄 回调第${attempt}次失败: ${log.requestId} 将在${Math.round(delayMs / 1000)}秒后重试`);
      }
    }

    await this.callbackRepo.save(log);
    return log;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async retryPendingCallbacks() {
    const now = new Date();
    const logs = await this.callbackRepo
      .createQueryBuilder('c')
      .where(new Brackets((sq) => {
        sq.where('c.status = :st1', { st1: CallbackStatus.RETRYING })
          .andWhere('c.nextRetryAt <= :now', { now })
          .orWhere('c.status = :st2', { st2: CallbackStatus.PENDING });
      }))
      .andWhere('c.retryCount < c.maxRetryCount')
      .orderBy('c.nextRetryAt', 'ASC')
      .addOrderBy('c.createdAt', 'ASC')
      .take(30)
      .getMany();

    if (logs.length > 0) {
      this.logger.log(`⏰ 定时重试回调任务: ${logs.length}条待执行`);
      for (const log of logs) {
        setImmediate(() => this.executeCallback(log.id));
      }
    }
  }

  async retryById(id: string, user: CurrentUserPayload) {
    const log = await this.callbackRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('回调记录不存在');
    log.retryCount = 0;
    log.status = CallbackStatus.PENDING;
    log.nextRetryAt = null;
    log.failureReason = null;
    await this.callbackRepo.save(log);
    setImmediate(() => this.executeCallback(log.id));
    await this.addAuditLog(user.id, user.realName, AuditAction.UPDATE, 'callback', id, log.requestId, null, { action: 'manual_retry' });
    return { success: true, message: '已加入重试队列' };
  }

  async cancelById(id: string, user: CurrentUserPayload) {
    const log = await this.callbackRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('回调记录不存在');
    if (log.status === CallbackStatus.SUCCESS) {
      throw new Error('已成功的回调不能取消');
    }
    log.status = CallbackStatus.CANCELLED;
    log.failureReason = `手动取消 by ${user.realName}`;
    await this.callbackRepo.save(log);
    await this.addAuditLog(user.id, user.realName, AuditAction.UPDATE, 'callback', id, log.requestId, null, { action: 'cancel' });
    return { success: true };
  }

  async getCallback(id: string) {
    const log = await this.callbackRepo.findOne({ where: { id } });
    if (!log) throw new NotFoundException('回调记录不存在');
    return log;
  }

  async queryCallbacks(query: QueryCallbackDto) {
    const { page = 1, pageSize = 20, keyword, callbackType, status, relatedId, relatedType, dateRangeStart, dateRangeEnd, hasFailureReason } = query;
    const qb = this.callbackRepo.createQueryBuilder('c');

    if (keyword) {
      qb.andWhere(new Brackets((sq) => {
        sq.where('c.requestId ILIKE :kw', { kw: `%${keyword}%` })
          .orWhere('c.targetUrl ILIKE :kw', { kw: `%${keyword}%` })
          .orWhere('c.failureReason ILIKE :kw', { kw: `%${keyword}%` })
          .orWhere('c.responseBody ILIKE :kw', { kw: `%${keyword}%` });
      }));
    }
    if (callbackType) qb.andWhere('c.callbackType = :ct', { ct: callbackType });
    if (status) qb.andWhere('c.status = :st', { st: status });
    if (relatedId) qb.andWhere('c.relatedId = :rid', { rid: relatedId });
    if (relatedType) qb.andWhere('c.relatedType = :rt', { rt: relatedType });
    if (dateRangeStart) qb.andWhere('c.createdAt >= :ds', { ds: dateRangeStart });
    if (dateRangeEnd) qb.andWhere('c.createdAt <= :de', { de: dateRangeEnd });
    if (hasFailureReason === true) qb.andWhere('c.failureReason IS NOT NULL AND c.failureReason <> \'\'');

    qb.orderBy('c.createdAt', 'DESC').skip((page - 1) * pageSize).take(pageSize);
    const [list, total] = await qb.getManyAndCount();
    return { list, total, page, pageSize };
  }

  async getStats() {
    const total = await this.callbackRepo.count();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const t of Object.values(CallbackType)) {
      byType[t] = await this.callbackRepo.count({ where: { callbackType: t } });
    }
    for (const s of Object.values(CallbackStatus)) {
      byStatus[s] = await this.callbackRepo.count({ where: { status: s } });
    }

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayCount = await this.callbackRepo.createQueryBuilder('c')
      .where('c.createdAt >= :ts', { ts: todayStart }).getCount();
    const todayFailed = await this.callbackRepo.createQueryBuilder('c')
      .where('c.createdAt >= :ts AND c.status = :st', { ts: todayStart, st: CallbackStatus.FAILED }).getCount();
    const avgDuration = await this.callbackRepo.createQueryBuilder('c')
      .select('AVG(c.durationMs)', 'avg').where('c.durationMs IS NOT NULL').getRawOne();

    return {
      total,
      byType,
      byStatus,
      today: { count: todayCount, failed: todayFailed },
      avgDurationMs: parseFloat(avgDuration.avg || '0'),
    };
  }

  private async addAuditLog(userId: string, userName: string, action: AuditAction, targetType: string, targetId: string, targetName?: string, beforeData?: any, afterData?: any) {
    try {
      const log = this.auditLogRepo.create({ userId, userName, action, targetType, targetId, targetName, beforeData, afterData });
      await this.auditLogRepo.save(log);
    } catch (e) {}
  }
}
