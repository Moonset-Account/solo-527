import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/db';

export async function logAudit(
  userId: string | null,
  action: string,
  resourceType: string,
  resourceId: string | null,
  oldValues: any,
  newValues: any,
  ipAddress: string = '127.0.0.1',
  userAgent: string = ''
): Promise<void> {
  try {
    const user = userId ? await db('users').where({ id: userId }).first() : null;

    const description = generateDescription(action, resourceType, resourceId, newValues);

    await db('audit_logs').insert({
      id: uuidv4(),
      user_id: userId,
      user_name: user?.name || 'system',
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      description,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date()
    });
  } catch (error) {
    console.error('写入审计日志失败:', error);
  }
}

function generateDescription(
  action: string,
  resourceType: string,
  resourceId: string | null,
  values: any
): string {
  const moduleLabels: Record<string, string> = {
    reservation: '预约',
    equipment: '设备',
    maintenance: '维修工单',
    settlement: '结算',
    work_order: '作业工单',
    user: '用户',
    auth: '认证',
    field: '地块'
  };

  const actionLabels: Record<string, string> = {
    create: '创建',
    create_waitlisted: '创建候补预约',
    update: '更新',
    delete: '删除',
    confirm: '确认',
    cancel: '取消',
    rain_cancel: '雨天自动取消',
    complete: '完成',
    start_work: '开始作业',
    complete_work: '完成作业',
    resubmit: '重新提交',
    breakdown_reschedule: '设备故障重排',
    login: '登录',
    logout: '登出'
  };

  const moduleName = moduleLabels[resourceType] || resourceType;
  const actionName = actionLabels[action] || action;

  let extra = '';
  if (values) {
    if (values.status && values.status !== 'pending') {
      const statusLabels: Record<string, string> = {
        pending: '待确认',
        confirmed: '已确认',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
        waitlisted: '候补中'
      };
      extra = `，状态：${statusLabels[values.status] || values.status}`;
    }
    if (values.cancel_reason) {
      extra = `，原因：${values.cancel_reason}`;
    }
  }

  return `${actionName}${moduleName}${extra}`;
}

export async function getAuditLogs(filters?: {
  user_id?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  let query = db('audit_logs')
    .orderBy('audit_logs.created_at', 'desc')
    .select('audit_logs.*');

  if (filters?.user_id) {
    query = query.where('audit_logs.user_id', filters.user_id);
  }
  if (filters?.action) {
    query = query.where('audit_logs.action', filters.action);
  }
  if (filters?.resource_type) {
    query = query.where('audit_logs.resource_type', filters.resource_type);
  }
  if (filters?.start_date) {
    query = query.where('audit_logs.created_at', '>=', filters.start_date);
  }
  if (filters?.end_date) {
    query = query.where('audit_logs.created_at', '<=', filters.end_date);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.offset(filters.offset);
  }

  const logs = await query;

  return logs.map(log => ({
    ...log,
    old_values: log.old_values ? tryParseJSON(log.old_values) : null,
    new_values: log.new_values ? tryParseJSON(log.new_values) : null
  }));
}

function tryParseJSON(str: string): any {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}
