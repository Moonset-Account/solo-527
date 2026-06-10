'use server';

import { db, DEFAULT_USER_ID } from '@/lib/db-adapter';
import type { Plan, Subscription, Invoice, ChangeLog } from '@/types';
import { addDays, format, startOfDay } from 'date-fns';
import { revalidatePath } from 'next/cache';

export type BillingCycle = 'MONTHLY' | 'YEARLY';

export interface SubscribeActionResult {
  success: boolean;
  error?: string;
  data?: {
    subscription?: Subscription & { plan?: Plan };
    invoice?: Invoice;
    changeLog?: ChangeLog;
    actionType: 'CREATE' | 'UPGRADE' | 'DOWNGRADE' | 'RENEW';
    message: string;
  };
}

const computePrice = (plan: Plan, cycle: BillingCycle): number => {
  const monthly = Number(plan.price) || 0;
  if (cycle === 'YEARLY') {
    return Math.round(monthly * 12 * 0.83);
  }
  return monthly;
};

const getBillingPeriodLabel = (start: Date, cycle: BillingCycle): string => {
  if (cycle === 'YEARLY') {
    return `${start.getFullYear()}年${start.getMonth() + 1}月 - ${addMonths(start, 11).getFullYear()}年${addMonths(start, 11).getMonth() + 1}月`;
  }
  return `${start.getFullYear()}年${start.getMonth() + 1}月`;
};

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

const getCycleDays = (cycle: BillingCycle): number => {
  return cycle === 'YEARLY' ? 365 : 30;
};

const getPlanRank = (planId: string): number => {
  const order: Record<string, number> = {
    plan_free: 0,
    plan_starter: 1,
    plan_pro: 2,
    plan_enterprise: 3,
  };
  if (order[planId] !== undefined) return order[planId];
  const map: Record<string, number> = {};
  for (const [k, v] of Object.entries(order)) map[k] = v;
  const keys = Object.keys(map).sort((a, b) => map[a] - map[b]);
  if (!keys.length) return 0;
  return 0;
};

function determineActionType(
  existingSub: (Subscription & { plan?: Plan }) | null,
  newPlan: Plan
): 'CREATE' | 'UPGRADE' | 'DOWNGRADE' | 'RENEW' {
  if (!existingSub) return 'CREATE';
  if (existingSub.planId === newPlan.id) return 'RENEW';
  const oldRank = getPlanRank(existingSub.planId);
  const newRank = getPlanRank(newPlan.id);
  return newRank >= oldRank ? 'UPGRADE' : 'DOWNGRADE';
}

export async function subscribeToPlan(
  planId: string,
  billingCycle: BillingCycle = 'MONTHLY',
  userId: string = DEFAULT_USER_ID
): Promise<SubscribeActionResult> {
  try {
    const plan = await db.findPlanById(planId);
    if (!plan) {
      return { success: false, error: '套餐不存在' };
    }
    if (plan.status !== 'ACTIVE' && plan.id !== 'plan_free') {
      return { success: false, error: '该套餐已下架，无法订购' };
    }

    const existingSub = await db.findSubscriptionByUser(userId);
    const actionType = determineActionType(existingSub, plan);
    const price = computePrice(plan, billingCycle);

    const now = new Date();
    const nowISO = now.toISOString();
    const cycleDays = getCycleDays(billingCycle);

    let subscription: Subscription & { plan?: Plan };
    let changeLog: ChangeLog | undefined;
    let invoiceResult: { invoice: Invoice; items: any[] };

    const billingPeriodStart = startOfDay(now);
    const billingPeriodEnd = addDays(billingPeriodStart, cycleDays);
    const billingPeriodLabel = getBillingPeriodLabel(billingPeriodStart, billingCycle);
    const dueDate = addDays(now, 15).toISOString();

    if (actionType === 'CREATE') {
      const status: any = plan.trialDays && plan.trialDays > 0 && price > 0 ? 'TRIALING' : 'ACTIVE';
      const trialDays = plan.trialDays || 0;
      const hasTrial = trialDays > 0 && price > 0;

      const createdSub = await db.createSubscription({
        userId,
        planId: plan.id,
        status,
        currentPeriodStart: billingPeriodStart.toISOString(),
        currentPeriodEnd: hasTrial ? addDays(now, trialDays).toISOString() : billingPeriodEnd.toISOString(),
        trialStart: hasTrial ? nowISO : null,
        trialEnd: hasTrial ? addDays(now, trialDays).toISOString() : null,
        trialUsed: !hasTrial,
        seatsIncluded: plan.seatLimit,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      subscription = { ...createdSub, plan };

      changeLog = await db.createChangeLog({
        subscriptionId: subscription.id,
        type: 'PLAN_CHANGE',
        oldPlanId: null,
        newPlanId: plan.id,
        oldValue: '无订阅',
        newValue: plan.name,
        note: hasTrial ? `用户开通 ${plan.name}（${billingCycle === 'YEARLY' ? '年付' : '月付'}），已开启 ${trialDays} 天试用` : `用户开通 ${plan.name}（${billingCycle === 'YEARLY' ? '年付' : '月付'}）`,
        result: 'success',
        changedBy: userId,
      });

      invoiceResult = await db.createInvoice({
        userId,
        subscriptionId: subscription.id,
        amount: price,
        paidAmount: hasTrial || price === 0 ? price : 0,
        status: hasTrial || price === 0 ? 'PAID' : 'OPEN',
        dueDate: hasTrial || price === 0 ? nowISO : dueDate,
        billingPeriod: billingPeriodLabel,
        description: hasTrial
          ? `${plan.name} ${trialDays} 天试用（${billingCycle === 'YEARLY' ? '年付' : '月付'}）`
          : `${plan.name}${billingCycle === 'YEARLY' ? '年度' : '月度'}订阅`,
        items: [
          {
            description: hasTrial
              ? `${plan.name} 试用（${trialDays}天）`
              : `${plan.name}${billingCycle === 'YEARLY' ? '年度' : '月度'}订阅费`,
            amount: price,
            quantity: 1,
            type: 'SUBSCRIPTION',
            unitPrice: price,
          },
        ],
      });
    } else {
      const oldPlanId = existingSub!.planId;
      const oldPlanName = existingSub!.plan?.name || '旧套餐';
      const oldStatus = existingSub!.status;

      const updatedSub = await db.updateSubscription(existingSub!.id, {
        planId: plan.id,
        status: price === 0 ? 'ACTIVE' : (actionType === 'RENEW' && oldStatus === 'ACTIVE' ? 'ACTIVE' : 'ACTIVE'),
        currentPeriodStart: billingPeriodStart.toISOString(),
        currentPeriodEnd: billingPeriodEnd.toISOString(),
        seatsIncluded: plan.seatLimit,
        cancelAtPeriodEnd: false,
        canceledAt: null,
      });
      subscription = { ...updatedSub, plan };

      const logType: any =
        actionType === 'UPGRADE' ? 'UPGRADE' :
        actionType === 'DOWNGRADE' ? 'DOWNGRADE' : 'PLAN_CHANGE';

      changeLog = await db.createChangeLog({
        subscriptionId: subscription.id,
        type: logType,
        oldPlanId,
        newPlanId: plan.id,
        oldValue: oldPlanName,
        newValue: `${plan.name}（${billingCycle === 'YEARLY' ? '年付' : '月付'}）`,
        note:
          actionType === 'UPGRADE' ? `用户从「${oldPlanName}」升级到「${plan.name}」，席位调整为 ${plan.seatLimit} 席` :
          actionType === 'DOWNGRADE' ? `用户从「${oldPlanName}」降级到「${plan.name}」，席位调整为 ${plan.seatLimit} 席` :
          `用户续订「${plan.name}」（${billingCycle === 'YEARLY' ? '年付' : '月付'}）`,
        result: 'success',
        changedBy: userId,
      });

      if (actionType === 'UPGRADE' || actionType === 'DOWNGRADE') {
        await db.createChangeLog({
          subscriptionId: subscription.id,
          type: 'SEAT_CHANGE',
          oldPlanId,
          newPlanId: plan.id,
          oldValue: String(existingSub!.seatsIncluded || existingSub!.plan?.seatLimit || 0),
          newValue: String(plan.seatLimit),
          note: `因套餐${actionType === 'UPGRADE' ? '升级' : '降级'}自动调整席位数`,
          result: 'success',
          changedBy: 'system',
        });
      }

      invoiceResult = await db.createInvoice({
        userId,
        subscriptionId: subscription.id,
        amount: price,
        paidAmount: price === 0 ? 0 : 0,
        status: price === 0 ? 'PAID' : 'OPEN',
        dueDate: price === 0 ? nowISO : dueDate,
        billingPeriod: billingPeriodLabel,
        description:
          actionType === 'UPGRADE' ? `升级至 ${plan.name}（${billingCycle === 'YEARLY' ? '年付' : '月付'}）` :
          actionType === 'DOWNGRADE' ? `降级至 ${plan.name}（${billingCycle === 'YEARLY' ? '年付' : '月付'}）` :
          `${plan.name}${billingCycle === 'YEARLY' ? '年度' : '月度'}订阅续费`,
        items: [
          {
            description:
              actionType === 'UPGRADE' ? `${oldPlanName} → ${plan.name} 升级费用` :
              actionType === 'DOWNGRADE' ? `${oldPlanName} → ${plan.name} 降级结算` :
              `${plan.name}${billingCycle === 'YEARLY' ? '年度' : '月度'}订阅费`,
            amount: price,
            quantity: 1,
            type: 'SUBSCRIPTION',
            unitPrice: price,
          },
        ],
      });
    }

    const actionMessages: Record<string, string> = {
      CREATE: price > 0 ? `已成功开通 ${plan.name}，${billingCycle === 'YEARLY' ? '年度' : '月度'}账单已生成` : `已成功开通 ${plan.name}（免费版）`,
      UPGRADE: `已成功升级到 ${plan.name}，升级账单已生成`,
      DOWNGRADE: `已成功降级到 ${plan.name}，新账期已生效`,
      RENEW: `${plan.name} 已续订，账单已生成`,
    };

    revalidatePath('/');
    revalidatePath('/pricing');
    revalidatePath('/billing');

    return {
      success: true,
      data: {
        subscription,
        invoice: invoiceResult.invoice,
        changeLog,
        actionType,
        message: actionMessages[actionType],
      },
    };
  } catch (e) {
    console.error('[subscribeToPlan] error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : '操作失败，请稍后重试',
    };
  }
}

export async function cancelSubscription(
  userId: string = DEFAULT_USER_ID,
  reason?: string
): Promise<SubscribeActionResult> {
  try {
    const existingSub = await db.findSubscriptionByUser(userId);
    if (!existingSub) {
      return { success: false, error: '未找到有效订阅' };
    }

    const updated = await db.updateSubscription(existingSub.id, {
      cancelAtPeriodEnd: true,
      canceledAt: new Date().toISOString(),
    });

    await db.createChangeLog({
      subscriptionId: existingSub.id,
      type: 'CANCEL',
      oldPlanId: existingSub.planId,
      newPlanId: null,
      oldValue: (existingSub as any).plan?.name || '当前套餐',
      newValue: '到期后取消',
      note: reason ? `用户主动取消订阅：${reason}` : '用户主动取消订阅，服务将在当前账期结束后终止',
      result: 'pending_end_of_period',
      changedBy: userId,
    });

    revalidatePath('/');
    revalidatePath('/pricing');
    revalidatePath('/billing');

    return {
      success: true,
      data: {
        subscription: { ...updated, plan: (existingSub as any).plan },
        actionType: 'RENEW',
        message: '已设置到期后取消订阅，您仍可使用服务至账期结束',
      },
    };
  } catch (e) {
    console.error('[cancelSubscription] error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : '操作失败，请稍后重试',
    };
  }
}
