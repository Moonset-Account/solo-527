import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { taskService } from './task.service';

const SCHEDULER_ZSET_KEY = 'scheduler:reminder-rules';

export interface ReminderRuleCreateInput {
  name: string;
  description?: string;
  filterStatus?: string;
  filterPriority?: string;
  filterAssigneeIds?: string[];
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CRON' | 'ONCE';
  cronExpr?: string;
  runDayOfWeek?: number;
  runDayOfMonth?: number;
  runTime: string;
  channel: string;
  content: string;
  enabled?: boolean;
  runOnceAt?: string;
  creatorId: string;
}

export interface ReminderRuleUpdateInput {
  name?: string;
  description?: string;
  filterStatus?: string;
  filterPriority?: string;
  filterAssigneeIds?: string[];
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CRON' | 'ONCE';
  cronExpr?: string;
  runDayOfWeek?: number;
  runDayOfMonth?: number;
  runTime?: string;
  channel?: string;
  content?: string;
  enabled?: boolean;
  runOnceAt?: string;
}

function computeNextRunAt(rule: {
  frequency: string;
  runTime: string;
  runDayOfWeek?: number | null;
  runDayOfMonth?: number | null;
  cronExpr?: string | null;
  lastRunAt?: Date | null;
  enabled: boolean;
  runOnceAt?: string;
}): Date | null {
  if (!rule.enabled) return null;
  const now = new Date();
  const [hourStr, minuteStr] = rule.runTime.split(':');
  const hour = parseInt(hourStr, 10) || 9;
  const minute = parseInt(minuteStr, 10) || 0;

  if (rule.frequency === 'ONCE') {
    const onceDate = rule.runOnceAt
      ? new Date(rule.runOnceAt)
      : new Date(rule.lastRunAt || now);
    onceDate.setHours(hour, minute, 0, 0);
    return onceDate > now ? onceDate : null;
  }

  if (rule.frequency === 'DAILY') {
    const next = new Date(rule.lastRunAt || now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (rule.frequency === 'WEEKLY') {
    const targetDow = rule.runDayOfWeek ?? 1;
    const next = new Date(rule.lastRunAt || now);
    next.setHours(hour, minute, 0, 0);
    const currentDow = next.getDay();
    let diff = targetDow - currentDow;
    if (diff < 0 || (diff === 0 && next <= now)) diff += 7;
    next.setDate(next.getDate() + diff);
    return next;
  }

  if (rule.frequency === 'MONTHLY') {
    const targetDom = rule.runDayOfMonth ?? 1;
    const next = new Date(rule.lastRunAt || now);
    next.setHours(hour, minute, 0, 0);
    next.setDate(targetDom);
    if (next <= now) next.setMonth(next.getMonth() + 1);
    return next;
  }

  if (rule.frequency === 'CRON' && rule.cronExpr) {
    try {
      const parts = rule.cronExpr.trim().split(/\s+/);
      if (parts.length >= 5) {
        const next = new Date(rule.lastRunAt || now);
        next.setSeconds(0, 0);
        next.setMinutes(parseInt(parts[0] === '*' ? String(minute) : parts[0]) || 0);
        next.setHours(parseInt(parts[1] === '*' ? String(hour) : parts[1]) || 0);
        if (next <= now) next.setDate(next.getDate() + 1);
        return next;
      }
    } catch {
      // fallback
    }
    const fallback = new Date(rule.lastRunAt || now);
    fallback.setHours(hour, minute, 0, 0);
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }

  return null;
}

function serializeRuleForZset(rule: { id: string; nextRunAt?: Date | null }) {
  if (!rule.nextRunAt) return null;
  return {
    member: rule.id,
    score: rule.nextRunAt.getTime(),
  };
}

export const reminderRuleService = {
  SCHEDULER_ZSET_KEY,

  async list(options: { page?: number; pageSize?: number; enabled?: boolean } = {}) {
    const page = options.page || 1;
    const pageSize = options.pageSize || 50;
    const where: any = {};
    if (typeof options.enabled === 'boolean') where.enabled = options.enabled;

    const [total, items] = await Promise.all([
      prisma.reminderRule.count({ where }),
      prisma.reminderRule.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { creator: { select: { id: true, name: true } } },
        orderBy: [{ enabled: 'desc' }, { nextRunAt: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);
    return { total, page, pageSize, items };
  },

  async getById(id: string) {
    return prisma.reminderRule.findUnique({
      where: { id },
      include: { creator: { select: { id: true, name: true } } },
    });
  },

  async create(input: ReminderRuleCreateInput) {
    const nextRunAt = computeNextRunAt({
      frequency: input.frequency,
      runTime: input.runTime,
      runDayOfWeek: input.runDayOfWeek,
      runDayOfMonth: input.runDayOfMonth,
      cronExpr: input.cronExpr,
      lastRunAt: null,
      enabled: input.enabled !== false,
      runOnceAt: input.runOnceAt,
    });

    const rule = await prisma.reminderRule.create({
      data: {
        name: input.name,
        description: input.description,
        filterStatus: input.filterStatus,
        filterPriority: input.filterPriority,
        filterAssigneeIds: input.filterAssigneeIds
          ? JSON.stringify(input.filterAssigneeIds)
          : undefined,
        frequency: input.frequency,
        cronExpr: input.cronExpr,
        runDayOfWeek: input.runDayOfWeek,
        runDayOfMonth: input.runDayOfMonth,
        runTime: input.runTime,
        channel: input.channel,
        content: input.content,
        enabled: input.enabled !== false,
        nextRunAt,
        creatorId: input.creatorId,
      },
    });

    const zsetItem = serializeRuleForZset(rule);
    if (zsetItem) {
      await redis.zadd(SCHEDULER_ZSET_KEY, zsetItem.score, zsetItem.member);
    }
    return rule;
  },

  async update(id: string, input: ReminderRuleUpdateInput) {
    const existing = await prisma.reminderRule.findUnique({ where: { id } });
    if (!existing) throw new Error('规则不存在');

    const merged = { ...existing, ...input } as any;
    const nextRunAt = computeNextRunAt({
      frequency: merged.frequency,
      runTime: merged.runTime,
      runDayOfWeek: merged.runDayOfWeek,
      runDayOfMonth: merged.runDayOfMonth,
      cronExpr: merged.cronExpr,
      lastRunAt: merged.lastRunAt,
      enabled: merged.enabled !== false,
      runOnceAt: input.runOnceAt,
    });

    const rule = await prisma.reminderRule.update({
      where: { id },
      data: {
        ...input,
        filterAssigneeIds: input.filterAssigneeIds
          ? JSON.stringify(input.filterAssigneeIds)
          : undefined,
        nextRunAt,
      },
    });

    await redis.zrem(SCHEDULER_ZSET_KEY, id);
    const zsetItem = serializeRuleForZset(rule);
    if (zsetItem) {
      await redis.zadd(SCHEDULER_ZSET_KEY, zsetItem.score, zsetItem.member);
    }
    return rule;
  },

  async delete(id: string) {
    const result = await prisma.reminderRule.delete({ where: { id } });
    await redis.zrem(SCHEDULER_ZSET_KEY, id);
    return result;
  },

  async toggleEnabled(id: string, enabled: boolean) {
    const existing = await prisma.reminderRule.findUnique({ where: { id } });
    if (!existing) throw new Error('规则不存在');

    const nextRunAt = computeNextRunAt({
      frequency: existing.frequency,
      runTime: existing.runTime,
      runDayOfWeek: existing.runDayOfWeek,
      runDayOfMonth: existing.runDayOfMonth,
      cronExpr: existing.cronExpr,
      lastRunAt: existing.lastRunAt,
      enabled,
    });

    const rule = await prisma.reminderRule.update({
      where: { id },
      data: { enabled, nextRunAt },
    });

    await redis.zrem(SCHEDULER_ZSET_KEY, id);
    const zsetItem = serializeRuleForZset(rule);
    if (zsetItem) {
      await redis.zadd(SCHEDULER_ZSET_KEY, zsetItem.score, zsetItem.member);
    }
    return rule;
  },

  async fetchDueRules(nowTs?: number): Promise<string[]> {
    const ts = nowTs ?? Date.now();
    return redis.zrangebyscore(SCHEDULER_ZSET_KEY, '-inf', ts);
  },

  async triggerRule(ruleId: string, operatorId: string): Promise<{
    triggered: number;
    matchedTasks: number;
    rule: any;
  }> {
    const rule = await prisma.reminderRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new Error('规则不存在');

    const filter: any = {};
    if (rule.filterStatus) {
      filter.status = { in: rule.filterStatus.split(',').map((s) => s.trim()) };
    }
    if (rule.filterPriority) {
      filter.priority = { in: rule.filterPriority.split(',').map((s) => s.trim()) };
    }
    if (rule.filterAssigneeIds) {
      try {
        const ids: string[] = JSON.parse(rule.filterAssigneeIds);
        if (ids.length > 0) filter.assigneeId = { in: ids };
      } catch {
        // ignore parse error
      }
    }
    filter.status = filter.status ?? { not: 'COMPLETED' };

    const tasks = await prisma.task.findMany({
      where: filter,
      select: { id: true, title: true, assigneeId: true, assignee: { select: { id: true, name: true } } },
    });

    let triggered = 0;
    const channels = rule.channel.split(',').map((c) => c.trim());
    for (const task of tasks) {
      if (!task.assigneeId) continue;
      for (const ch of channels) {
        try {
          const content = rule.content
            .replace(/{{title}}/g, task.title)
            .replace(/{{assignee}}/g, task.assignee?.name || '')
            .replace(/{{date}}/g, new Date().toLocaleDateString('zh-CN'));
          await taskService.sendReminder(task.id, operatorId, { content, channel: ch });
          triggered++;
        } catch (err) {
          // skip single failure
        }
      }
    }

    const updatedNextRun = computeNextRunAt({
      frequency: rule.frequency,
      runTime: rule.runTime,
      runDayOfWeek: rule.runDayOfWeek,
      runDayOfMonth: rule.runDayOfMonth,
      cronExpr: rule.cronExpr,
      lastRunAt: new Date(),
      enabled: rule.enabled,
    });

    const updated = await prisma.reminderRule.update({
      where: { id: ruleId },
      data: {
        lastRunAt: new Date(),
        nextRunAt: updatedNextRun,
      },
    });

    await redis.zrem(SCHEDULER_ZSET_KEY, ruleId);
    const zsetItem = serializeRuleForZset(updated);
    if (zsetItem) {
      await redis.zadd(SCHEDULER_ZSET_KEY, zsetItem.score, zsetItem.member);
    }

    return { triggered, matchedTasks: tasks.length, rule: updated };
  },

  async dispatchDue(operatorId: string): Promise<{
    dispatched: number;
    totalTriggered: number;
    rules: Array<{ id: string; name: string; triggered: number }>;
  }> {
    const dueIds = await this.fetchDueRules();
    const results: Array<{ id: string; name: string; triggered: number }> = [];
    let totalTriggered = 0;

    for (const id of dueIds) {
      try {
        const rule = await prisma.reminderRule.findUnique({ where: { id } });
        if (!rule || !rule.enabled) {
          await redis.zrem(SCHEDULER_ZSET_KEY, id);
          continue;
        }
        const res = await this.triggerRule(id, operatorId);
        totalTriggered += res.triggered;
        results.push({ id, name: rule.name, triggered: res.triggered });
      } catch {
        // skip
      }
    }

    return { dispatched: dueIds.length, totalTriggered, rules: results };
  },

  async resyncAllToRedis(): Promise<{ synced: number }> {
    await redis.del(SCHEDULER_ZSET_KEY);
    const rules = await prisma.reminderRule.findMany({
      where: { enabled: true, nextRunAt: { not: null } },
      select: { id: true, nextRunAt: true },
    });
    if (rules.length > 0) {
      const args: Array<string | number> = [];
      for (const r of rules) {
        if (r.nextRunAt) {
          args.push(r.nextRunAt.getTime(), r.id);
        }
      }
      if (args.length > 0) {
        await redis.zadd(SCHEDULER_ZSET_KEY, ...(args as any));
      }
    }
    return { synced: rules.length };
  },
};
