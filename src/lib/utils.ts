import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern: string = 'yyyy-MM-dd') {
  if (!date) return '-';
  return format(new Date(date), pattern, { locale: zhCN });
}

export function formatDateTime(date: string | Date) {
  if (!date) return '-';
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatRelativeTime(date: string | Date) {
  if (!date) return '-';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
}

export function formatCurrency(amount: number | undefined, currency: string = 'CNY') {
  if (amount === undefined || amount === null) return '-';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export async function logError(error: Error, path?: string, metadata?: Record<string, unknown>) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('error_logs').insert({
      error_code: error.name,
      error_message: error.message,
      stack_trace: error.stack,
      path,
      metadata: metadata as any,
    });
  } catch (e) {
    console.error('Failed to log error:', e);
  }
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  content?: string,
  relatedId?: string,
  relatedType?: string
) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('notifications').insert({
      user_id: userId,
      type: type as any,
      title,
      content,
      related_id: relatedId,
      related_type: relatedType,
    });
  } catch (e) {
    console.error('Failed to create notification:', e);
  }
}

export async function createExecutionRecord(
  applicationId: string,
  action: string,
  description?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('execution_records').insert({
      application_id: applicationId,
      action,
      description,
      performed_by: userData.user?.id,
      metadata: metadata as any,
    });
  } catch (e) {
    console.error('Failed to create execution record:', e);
  }
}

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  pending_review: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-blue-100 text-blue-800',
  inventory_verified: 'bg-indigo-100 text-indigo-800',
  schedule_confirmed: 'bg-purple-100 text-purple-800',
  awaiting_confirmation: 'bg-orange-100 text-orange-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  in_collection: 'bg-green-100 text-green-800',
  on_loan: 'bg-blue-100 text-blue-800',
  in_transit: 'bg-yellow-100 text-yellow-800',
  in_installation: 'bg-purple-100 text-purple-800',
  in_deinstallation: 'bg-orange-100 text-orange-800',
  under_conservation: 'bg-red-100 text-red-800',
  retired: 'bg-gray-100 text-gray-800',
  submitted: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  expired: 'bg-gray-100 text-gray-800',
  preparing: 'bg-gray-100 text-gray-800',
  delivered: 'bg-blue-100 text-blue-800',
  received: 'bg-green-100 text-green-800',
  returned: 'bg-green-100 text-green-800',
  pending_confirmation: 'bg-yellow-100 text-yellow-800',
  disputed: 'bg-red-100 text-red-800',
};

export const statusLabels: Record<string, string> = {
  draft: '草稿',
  pending_review: '待审核',
  qualified: '资格通过',
  inventory_verified: '库存已核验',
  schedule_confirmed: '时段已确认',
  awaiting_confirmation: '待人工确认',
  confirmed: '已确认',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  rejected: '已拒绝',
  in_collection: '馆藏中',
  on_loan: '外借中',
  in_transit: '运输中',
  in_installation: '布展中',
  in_deinstallation: '撤展中',
  under_conservation: '修复中',
  retired: '已退役',
  submitted: '已提交',
  verified: '已核验',
  expired: '已过期',
  preparing: '准备中',
  delivered: '已送达',
  received: '已签收',
  returned: '已归还',
  pending_confirmation: '待确认',
  disputed: '有争议',
};

export const roleLabels: Record<string, string> = {
  admin: '系统管理员',
  curator: '策展人',
  registrar: '登记员',
  conservator: '文物保护员',
  logistics: '物流专员',
  finance: '财务人员',
  viewer: '查看者',
};
