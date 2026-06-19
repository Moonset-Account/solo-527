import { NextRequest, NextResponse } from 'next/server';
import { getDataService } from '@/lib/data-service';
import { REMINDER_QUEUE_KEY } from '@/lib/redis';
import { ReminderType, RiskLevel, ContractStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const svc = await getDataService();
    const { action } = await request.json();

    switch (action) {
      case 'checkDeadlines':
        await checkReviewDeadlines(svc);
        return NextResponse.json({ success: true, message: '已检查截止日期提醒' });

      case 'checkMaterials':
        await checkMaterialCompleteness(svc);
        return NextResponse.json({ success: true, message: '已检查材料完整性' });

      case 'checkRiskAlerts':
        await checkRiskAlerts(svc);
        return NextResponse.json({ success: true, message: '已检查风险预警' });

      case 'checkEfficiency':
        await checkEfficiency(svc);
        return NextResponse.json({ success: true, message: '已检查审阅效率' });

      case 'processQueue':
        const result = await processReminderQueue(svc);
        return NextResponse.json({ success: true, processed: result });

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: '后台任务执行失败' }, { status: 500 });
  }
}

async function checkReviewDeadlines(svc: Awaited<ReturnType<typeof getDataService>>) {
  const now = new Date();
  const contracts = await svc.getContracts({
    status: ContractStatus.UNDER_REVIEW,
  });
  const pendingContracts = await svc.getContracts({
    status: ContractStatus.PENDING_REVIEW,
  });
  const reviseContracts = await svc.getContracts({
    status: ContractStatus.REVISE_REQUESTED,
  });
  const allContracts = [...contracts, ...pendingContracts, ...reviseContracts];

  for (const contract of allContracts) {
    if (!contract.deadline || !contract.assigneeId) continue;

    const deadline = new Date(contract.deadline);
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft > 0 && hoursLeft <= 24) {
      const existingReminder = await svc.getReminders({
        contractId: contract.id,
        userId: contract.assigneeId,
      });
      const hasDeadlineReminder = existingReminder.some(r => r.type === ReminderType.REVIEW_DEADLINE);

      if (!hasDeadlineReminder) {
        await svc.pushReminder(
          ReminderType.REVIEW_DEADLINE,
          contract.assigneeId,
          '审阅即将到期',
          `《${contract.title}》审阅即将到期，请尽快处理`,
          contract.id
        );
      }
    }
  }
}

async function checkMaterialCompleteness(svc: Awaited<ReturnType<typeof getDataService>>) {
  const contracts = await svc.getContracts({
    materialComplete: false,
  });

  for (const contract of contracts) {
    const materials = await svc.getContractMaterials(contract.id);

    const allVerified = materials.length > 0 && materials.every(m => m.status === 'VERIFIED');

    if (materials.length > 0 && allVerified) {
      await svc.updateContract(contract.id, { materialComplete: true });
    }

    if (materials.length === 0 || !allVerified) {
      if (contract.assigneeId) {
        await svc.pushReminder(
          ReminderType.MATERIAL_INCOMPLETE,
          contract.assigneeId,
          '证据材料不完整',
          `《${contract.title}》证据材料不完整，请补充`,
          contract.id
        );
      }
    }
  }
}

async function checkRiskAlerts(svc: Awaited<ReturnType<typeof getDataService>>) {
  const allContracts = await svc.getContracts();
  const highRiskContracts = allContracts.filter(c =>
    c.riskLevel === RiskLevel.HIGH || c.riskLevel === RiskLevel.CRITICAL
  );

  const allUsers = await svc.getUsers();
  const legalManagers = allUsers.filter(u => u.role === 'LEGAL_MANAGER');

  for (const contract of highRiskContracts) {
    for (const manager of legalManagers) {
      const existingAlerts = await svc.getReminders({
        contractId: contract.id,
        userId: manager.id,
      });
      const hasRiskAlert = existingAlerts.some(r => r.type === ReminderType.RISK_ALERT);

      if (!hasRiskAlert) {
        await svc.pushReminder(
          ReminderType.RISK_ALERT,
          manager.id,
          '高风险合同预警',
          `《${contract.title}》被标记为${contract.riskLevel === RiskLevel.CRITICAL ? '严重风险' : '高风险'}，请重点关注`,
          contract.id
        );
      }
    }
  }
}

async function checkEfficiency(svc: Awaited<ReturnType<typeof getDataService>>) {
  const stats = await svc.getEfficiencyStats();
  const validStats = stats.filter(s => s.avgReviewTime);
  const avgTime = validStats.length > 0
    ? validStats.reduce((sum, s) => sum + (s.avgReviewTime || 0), 0) / validStats.length
    : 0;

  const slowUsers = validStats.filter(s => (s.avgReviewTime || 0) > avgTime * 1.3);

  for (const stat of slowUsers) {
    const existing = await svc.getReminders({
      userId: stat.userId,
    });
    const hasEfficiencyReminder = existing.some(r => r.type === ReminderType.EFFICIENCY_REMINDER);

    if (!hasEfficiencyReminder) {
      await svc.pushReminder(
        ReminderType.EFFICIENCY_REMINDER,
        stat.userId,
        '效率提醒',
        '您的审阅效率略低于团队平均水平，建议优化工作流程'
      );
    }
  }
}

async function processReminderQueue(svc: Awaited<ReturnType<typeof getDataService>>): Promise<number> {
  let processed = 0;

  while (true) {
    const item = await popFromQueue();
    if (!item) break;

    try {
      const data = JSON.parse(item);

      await svc.pushReminder(
        data.type,
        data.userId || 'user-1',
        data.title || '系统提醒',
        data.message,
        data.contractId || undefined
      );

      processed++;
    } catch (e) {
      console.error('处理提醒队列失败:', e);
    }
  }

  return processed;
}

async function popFromQueue(): Promise<string | null> {
  try {
    const { redis } = await import('@/lib/redis');
    return await redis.rpop(REMINDER_QUEUE_KEY);
  } catch {
    return null;
  }
}
