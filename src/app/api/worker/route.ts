import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/mock-db';
import { pushReminderQueue, REMINDER_QUEUE_KEY } from '@/lib/redis';
import { ReminderType, RiskLevel } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'checkDeadlines':
        await checkReviewDeadlines();
        return NextResponse.json({ success: true, message: '已检查截止日期提醒' });

      case 'checkMaterials':
        await checkMaterialCompleteness();
        return NextResponse.json({ success: true, message: '已检查材料完整性' });

      case 'checkRiskAlerts':
        await checkRiskAlerts();
        return NextResponse.json({ success: true, message: '已检查风险预警' });

      case 'checkEfficiency':
        await checkEfficiency();
        return NextResponse.json({ success: true, message: '已检查审阅效率' });

      case 'processQueue':
        const result = await processReminderQueue();
        return NextResponse.json({ success: true, processed: result });

      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: '后台任务执行失败' }, { status: 500 });
  }
}

async function checkReviewDeadlines() {
  const now = new Date();
  const contracts = db.contracts.findMany({
    where: {
      status: { in: ['UNDER_REVIEW', 'PENDING_REVIEW', 'REVISE_REQUESTED'] },
    },
  });

  for (const contract of contracts) {
    if (!contract.deadline || !contract.assigneeId) continue;

    const deadline = new Date(contract.deadline);
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft > 0 && hoursLeft <= 24) {
      const existingReminder = db.reminders.findMany({
        where: {
          contractId: contract.id,
          userId: contract.assigneeId,
          type: ReminderType.REVIEW_DEADLINE,
        },
      });

      if (existingReminder.length === 0) {
        await pushReminderQueue({
          contractId: contract.id,
          userId: contract.assigneeId,
          type: ReminderType.REVIEW_DEADLINE,
          message: `《${contract.title}》审阅即将到期，请尽快处理`,
        });
      }
    }
  }
}

async function checkMaterialCompleteness() {
  const contracts = db.contracts.findMany({
    where: { materialComplete: false },
  });

  for (const contract of contracts) {
    const materials = db.evidenceMaterials.findMany({
      where: { contractId: contract.id },
    });

    const allVerified = materials.length > 0 && materials.every(m => m.status === 'VERIFIED');

    if (materials.length > 0 && allVerified) {
      db.contracts.update({
        where: { id: contract.id },
        data: { materialComplete: true },
      });
    }

    if (materials.length === 0 || !allVerified) {
      if (contract.assigneeId) {
        await pushReminderQueue({
          contractId: contract.id,
          userId: contract.assigneeId,
          type: ReminderType.MATERIAL_INCOMPLETE,
          message: `《${contract.title}》证据材料不完整，请补充`,
        });
      }
    }
  }
}

async function checkRiskAlerts() {
  const contracts = db.contracts.findMany({
    where: {
      riskLevel: { in: [RiskLevel.HIGH, RiskLevel.CRITICAL] },
    },
  });

  const legalManagers = db.users.findMany({
    where: { role: 'LEGAL_MANAGER' },
  });

  for (const contract of contracts) {
    for (const manager of legalManagers) {
      const existingAlert = db.reminders.findMany({
        where: {
          contractId: contract.id,
          userId: manager.id,
          type: ReminderType.RISK_ALERT,
        },
      });

      if (existingAlert.length === 0) {
        db.reminders.create({
          data: {
            type: ReminderType.RISK_ALERT,
            userId: manager.id,
            contractId: contract.id,
            title: '高风险合同预警',
            message: `《${contract.title}》被标记为${contract.riskLevel === 'CRITICAL' ? '严重风险' : '高风险'}，请重点关注`,
            isRead: false,
            isSent: true,
            sentAt: new Date().toISOString(),
          },
        });
      }
    }
  }
}

async function checkEfficiency() {
  const stats = db.efficiencyStats.findMany();
  const avgTime = stats.filter(s => s.avgReviewTime).reduce((sum, s) => sum + (s.avgReviewTime || 0), 0) / stats.filter(s => s.avgReviewTime).length || 0;

  const slowUsers = stats.filter(s => s.avgReviewTime && s.avgReviewTime > avgTime * 1.3);

  for (const stat of slowUsers) {
    const existing = db.reminders.findMany({
      where: {
        userId: stat.userId,
        type: ReminderType.EFFICIENCY_REMINDER,
      },
    });

    if (existing.length === 0) {
      await pushReminderQueue({
        userId: stat.userId,
        type: ReminderType.EFFICIENCY_REMINDER,
        message: '您的审阅效率略低于团队平均水平，建议优化工作流程',
      });
    }
  }
}

async function processReminderQueue(): Promise<number> {
  let processed = 0;

  while (true) {
    const item = await popFromQueue();
    if (!item) break;

    try {
      const data = JSON.parse(item);

      db.reminders.create({
        data: {
          type: data.type,
          userId: data.userId || 'user-1',
          contractId: data.contractId || null,
          ruleId: data.ruleId || null,
          title: data.title || '系统提醒',
          message: data.message,
          isRead: false,
          isSent: true,
          sentAt: new Date().toISOString(),
        },
      });

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
