import type { DeviceAlert, AlertStatus, AlertLevel, ProcessingLog, PaginatedResponse } from '../../shared/types';
import { mockAlerts, mockProcessingLogs, getAlertById as getMockAlertById, mockUsers } from '../mockData';
import { getPrismaClient } from '../prisma';
import { executeStrategyAction, matchStrategyForAlert, createPushLog } from './notification';
import { getStrategies } from './strategies';

interface AlertQuery {
  page?: number;
  pageSize?: number;
  status?: AlertStatus;
  level?: AlertLevel;
  deviceId?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

export async function getAlerts(query: AlertQuery): Promise<PaginatedResponse<DeviceAlert>> {
  const prisma = await getPrismaClient();
  const page = query.page || 1;
  const pageSize = query.pageSize || 20;
  const skip = (page - 1) * pageSize;

  if (prisma) {
    const where: any = {};
    
    if (query.status) where.status = query.status;
    if (query.level) where.alertLevel = query.level;
    if (query.deviceId) where.deviceId = query.deviceId;
    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword } },
        { deviceName: { contains: query.keyword } },
        { description: { contains: query.keyword } },
      ];
    }
    if (query.startDate) where.createdAt = { ...where.createdAt, gte: new Date(query.startDate) };
    if (query.endDate) where.createdAt = { ...where.createdAt, lte: new Date(query.endDate) };

    const [data, total] = await Promise.all([
      prisma.deviceAlert.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { handler: { select: { name: true } } },
      }),
      prisma.deviceAlert.count({ where }),
    ]);

    return {
      data: data.map(item => ({
        ...item,
        handlerName: item.handler?.name,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  }

  let filtered = [...mockAlerts];
  if (query.status) filtered = filtered.filter(a => a.status === query.status);
  if (query.level) filtered = filtered.filter(a => a.alertLevel === query.level);
  if (query.deviceId) filtered = filtered.filter(a => a.deviceId === query.deviceId);
  if (query.keyword) {
    const kw = query.keyword.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(kw) ||
      a.deviceName.toLowerCase().includes(kw) ||
      a.description.toLowerCase().includes(kw)
    );
  }

  const total = filtered.length;
  const data = filtered.slice(skip, skip + pageSize);

  return { data, total, page, pageSize };
}

export async function getAlertById(id: string): Promise<DeviceAlert | null> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const alert = await prisma.deviceAlert.findUnique({
      where: { id },
      include: {
        handler: { select: { name: true } },
        processingLogs: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (!alert) return null;

    return {
      ...alert,
      handlerName: alert.handler?.name,
      createdAt: alert.createdAt.toISOString(),
      updatedAt: alert.updatedAt.toISOString(),
      processingLogs: alert.processingLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };
  }

  return getMockAlertById(id) || null;
}

export async function updateAlertStatus(
  id: string,
  status: AlertStatus,
  remark: string,
  operatorId: string
): Promise<DeviceAlert | null> {
  const prisma = await getPrismaClient();
  
  const operator = mockUsers.find(u => u.id === operatorId) || mockUsers[0];
  const isAbnormalClose = status === 'ABNORMAL_CLOSED';
  
  let updatedAlert: DeviceAlert | null = null;

  if (prisma) {
    const alert = await prisma.deviceAlert.findUnique({ where: { id } });
    if (!alert) return null;

    let responseDurationSeconds = alert.responseDurationSeconds;
    if (status === 'PROCESSING' && !alert.handlerId) {
      responseDurationSeconds = Math.floor((Date.now() - alert.createdAt.getTime()) / 1000);
    }

    const updated = await prisma.deviceAlert.update({
      where: { id },
      data: {
        status,
        handlerId: operatorId,
        responseDurationSeconds,
        processingLogs: {
          create: {
            operatorId,
            operatorName: operator.name,
            action: getActionByStatus(status),
            remark,
          },
        },
      },
      include: {
        handler: { select: { name: true } },
        processingLogs: { orderBy: { timestamp: 'asc' } },
      },
    });

    updatedAlert = {
      ...updated,
      handlerName: updated.handler?.name,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      processingLogs: updated.processingLogs.map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString(),
      })),
    };
  } else {
    const alertIndex = mockAlerts.findIndex(a => a.id === id);
    if (alertIndex === -1) return null;

    const log: ProcessingLog = {
      id: `log${Date.now()}`,
      alertId: id,
      operatorId,
      operatorName: operator.name,
      action: getActionByStatus(status),
      remark,
      timestamp: new Date().toISOString(),
    };

    mockProcessingLogs.push(log);
    
    const alert = mockAlerts[alertIndex];
    mockAlerts[alertIndex] = {
      ...alert,
      status,
      handlerId: operatorId,
      handlerName: operator.name,
      responseDurationSeconds: alert.responseDurationSeconds || Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / 1000),
      updatedAt: new Date().toISOString(),
    };

    updatedAlert = getMockAlertById(id) || null;
  }

  if (isAbnormalClose && updatedAlert) {
    try {
      const strategiesResult = await getStrategies({ page: 1, pageSize: 100 });
      const matchedStrategy = matchStrategyForAlert(updatedAlert, strategiesResult.data);
      
      if (matchedStrategy) {
        const pushResults = await executeStrategyAction(updatedAlert, matchedStrategy);
        await createPushLog(updatedAlert.id, operatorId, pushResults);
        
        updatedAlert = await getAlertById(id);
      }
    } catch (error) {
      console.error('执行告警推送失败:', error);
    }
  }

  return updatedAlert;
}

function getActionByStatus(status: AlertStatus): string {
  const actions: Record<AlertStatus, string> = {
    PENDING: '重新打开',
    PROCESSING: '接单处理',
    COMPLETED: '处理完成',
    ABNORMAL_CLOSED: '异常关闭',
  };
  return actions[status];
}

export async function createAlertFromWebhook(alertData: Omit<DeviceAlert, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<DeviceAlert> {
  const prisma = await getPrismaClient();
  
  if (prisma) {
    const created = await prisma.deviceAlert.create({
      data: {
        ...alertData,
        status: 'PENDING',
      },
    });

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  const newAlert: DeviceAlert = {
    ...alertData,
    id: `alert${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockAlerts.unshift(newAlert);
  return newAlert;
}
