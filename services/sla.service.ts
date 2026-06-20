import { prisma } from '@/lib/prisma';
import { cacheGet, cacheSet, cacheDel } from '@/lib/redis';
import type { CreateSLARuleInput, UpdateSLARuleInput } from '@/lib/validation';

export async function getSLARules(includeInactive = false) {
  const cacheKey = 'sla:rules:active';
  if (!includeInactive) {
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;
  }

  const where = includeInactive ? {} : { isActive: true };
  const rules = await prisma.sLARule.findMany({
    where,
    include: {
      creator: { select: { name: true } },
      versions: { take: 3, orderBy: { version: 'desc' } },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });

  if (!includeInactive) {
    await cacheSet(cacheKey, rules, 1800);
  }
  return rules;
}

export async function getSLARuleById(id: string) {
  const cacheKey = `sla:rule:${id}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;

  const rule = await prisma.sLARule.findUnique({
    where: { id },
    include: {
      creator: { select: { name: true } },
      versions: {
        include: { changer: { select: { name: true } } },
        orderBy: { version: 'desc' },
      },
      tickets: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });

  if (rule) {
    await cacheSet(cacheKey, rule, 3600);
  }
  return rule;
}

export async function createSLARule(data: CreateSLARuleInput, createdBy: string) {
  const rule = await prisma.sLARule.create({
    data: { ...data, createdBy },
  });

  await prisma.sLARuleVersion.create({
    data: {
      slaRuleId: rule.id,
      ruleSnapshot: rule,
      version: 1,
      changeReason: '规则创建',
      changedBy: createdBy,
    },
  });

  await cacheDel('sla:rules:active');
  return rule;
}

export async function updateSLARule(
  id: string,
  data: UpdateSLARuleInput,
  changedBy: string
) {
  const { changeReason, ...updateData } = data;
  const current = await prisma.sLARule.findUnique({ where: { id } });
  if (!current) throw new Error('Rule not found');

  const newVersion = current.version + 1;
  const rule = await prisma.sLARule.update({
    where: { id },
    data: { ...updateData, version: newVersion },
  });

  await prisma.sLARuleVersion.create({
    data: {
      slaRuleId: id,
      ruleSnapshot: rule,
      version: newVersion,
      changeReason: changeReason!,
      changedBy,
    },
  });

  await cacheDel(`sla:rule:${id}`);
  await cacheDel('sla:rules:active');
  return rule;
}

export async function toggleSLARule(id: string, changedBy: string) {
  const current = await prisma.sLARule.findUnique({ where: { id } });
  if (!current) throw new Error('Rule not found');

  const newIsActive = !current.isActive;
  const rule = await prisma.sLARule.update({
    where: { id },
    data: { isActive: newIsActive },
  });

  await prisma.sLARuleVersion.create({
    data: {
      slaRuleId: id,
      ruleSnapshot: rule,
      version: current.version,
      changeReason: newIsActive ? '启用规则' : '禁用规则',
      changedBy,
    },
  });

  await cacheDel(`sla:rule:${id}`);
  await cacheDel('sla:rules:active');
  return rule;
}

export async function compareSLARuleVersions(ruleId: string, version1: number, version2: number) {
  const versions = await prisma.sLARuleVersion.findMany({
    where: { slaRuleId: ruleId, version: { in: [version1, version2] } },
    orderBy: { version: 'asc' },
  });

  if (versions.length !== 2) return null;

  return {
    older: versions[0],
    newer: versions[1],
    changes: generateChangeSummary(versions[0].ruleSnapshot, versions[1].ruleSnapshot),
  };
}

function generateChangeSummary(old: unknown, newer: unknown): string[] {
  const changes: string[] = [];
  const oldObj = old as Record<string, unknown>;
  const newObj = newer as Record<string, unknown>;

  if (oldObj.name !== newObj.name) changes.push(`名称: ${oldObj.name} → ${newObj.name}`);
  if (oldObj.responseTime !== newObj.responseTime) {
    changes.push(`响应时间: ${oldObj.responseTime}分钟 → ${newObj.responseTime}分钟`);
  }
  if (oldObj.resolutionTime !== newObj.resolutionTime) {
    changes.push(`解决时间: ${oldObj.resolutionTime}分钟 → ${newObj.resolutionTime}分钟`);
  }
  if (oldObj.isActive !== newObj.isActive) {
    changes.push(`状态: ${oldObj.isActive ? '启用' : '禁用'} → ${newObj.isActive ? '启用' : '禁用'}`);
  }

  return changes;
}
