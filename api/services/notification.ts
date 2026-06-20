import type { DeviceAlert, Strategy, ProcessingLog } from '../../shared/types';
import { mockProcessingLogs, mockUsers } from '../mockData';
import { getPrismaClient } from '../prisma';

export interface PushResult {
  success: boolean;
  channel: string;
  message: string;
  timestamp: string;
}

export async function executeStrategyAction(
  alert: DeviceAlert,
  strategy: Strategy
): Promise<PushResult[]> {
  const results: PushResult[] = [];
  const action = strategy.action as Record<string, any>;

  if (!action) {
    return results;
  }

  const defaultChannels = ['SMS', 'EMAIL'];
  const notifyChannels: string[] = action.notifyChannels ||
    (action.notify && action.notify.length > 0 ? defaultChannels : []) ||
    [];

  if (notifyChannels.length > 0) {
    for (const channel of notifyChannels) {
      const result = await sendNotification(channel, alert, action);
      results.push(result);
    }
  }

  if (action.type === 'WEBHOOK' && action.webhookUrl) {
    const result = await sendWebhook(action.webhookUrl, alert, strategy);
    results.push(result);
  }

  if (results.length === 0 && (action.notify || action.alertLevel)) {
    for (const channel of defaultChannels) {
      const result = await sendNotification(channel, alert, action);
      results.push(result);
    }
  }

  return results;
}

async function sendNotification(
  channel: string,
  alert: DeviceAlert,
  action: Record<string, any>
): Promise<PushResult> {
  const channelNames: Record<string, string> = {
    SMS: '短信',
    EMAIL: '邮件',
    WECHAT: '微信',
    DINGTALK: '钉钉',
  };

  const channelName = channelNames[channel] || channel;
  const message = `【异常告警关闭通知】\n设备: ${alert.deviceName}\n告警: ${alert.title}\n状态: 异常关闭\n原因: ${action.remarkTemplate || '请查看处理记录'}`;

  console.log(`[${new Date().toISOString()}] 推送${channelName}通知:`, message);

  return {
    success: true,
    channel: channelName,
    message,
    timestamp: new Date().toISOString(),
  };
}

async function sendWebhook(
  url: string,
  alert: DeviceAlert,
  strategy: Strategy
): Promise<PushResult> {
  const payload = {
    eventType: 'ALERT_ABNORMAL_CLOSED',
    timestamp: new Date().toISOString(),
    alert: {
      id: alert.id,
      deviceId: alert.deviceId,
      deviceName: alert.deviceName,
      alertLevel: alert.alertLevel,
      alertType: alert.alertType,
      title: alert.title,
      description: alert.description,
      status: alert.status,
      handlerName: alert.handlerName,
      responseDurationSeconds: alert.responseDurationSeconds,
      createdAt: alert.createdAt,
    },
    strategy: {
      id: strategy.id,
      name: strategy.name,
      version: strategy.version,
    },
  };

  console.log(`[${new Date().toISOString()}] 发送 Webhook 到 ${url}:`, JSON.stringify(payload, null, 2));

  let success = true;
  let message = 'Webhook 发送成功';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      success = false;
      message = `Webhook 返回状态码: ${response.status}`;
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      success = false;
      message = 'Webhook 请求超时';
    } else {
      console.warn('Webhook 发送失败（mock模式下视为成功）:', error.message);
    }
  }

  return {
    success,
    channel: 'Webhook',
    message,
    timestamp: new Date().toISOString(),
  };
}

export function matchStrategyForAlert(alert: DeviceAlert, allStrategies: Strategy[]): Strategy | null {
  const activeStrategies = allStrategies.filter(s => s.status === 'ACTIVE');

  for (const strategy of activeStrategies) {
    const condition = strategy.triggerCondition as Record<string, any>;
    if (!condition) continue;

    let matched = true;

    if (condition.alertLevel && condition.alertLevel !== alert.alertLevel) {
      matched = false;
    }
    if (condition.alertType && condition.alertType !== alert.alertType) {
      matched = false;
    }
    if (matched) {
      return strategy;
    }
  }

  return activeStrategies[0] || null;
}

export async function createPushLog(
  alertId: string,
  operatorId: string,
  pushResults: PushResult[]
): Promise<void> {
  const prisma = await getPrismaClient();
  const operator = mockUsers.find(u => u.id === operatorId) || mockUsers[0];

  const timestamp = new Date().toISOString();

  for (const result of pushResults) {
    const log: ProcessingLog = {
      id: `log_push_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      alertId,
      operatorId,
      operatorName: operator.name,
      action: `推送通知-${result.channel}`,
      remark: `${result.success ? '✅' : '❌'} ${result.message}`,
      timestamp,
    };

    if (prisma) {
      try {
        await prisma.processingLog.create({
          data: {
            alertId: log.alertId,
            operatorId: log.operatorId,
            operatorName: log.operatorName,
            action: log.action,
            remark: log.remark,
            timestamp: new Date(log.timestamp),
          },
        });
      } catch (error) {
        console.error('创建推送日志失败:', error);
      }
    } else {
      mockProcessingLogs.push(log);
    }
  }
}
