import React from 'react';
import { Tag } from 'antd';
import type { AlertStatus, AlertLevel, StrategyStatus } from '../../shared/types';
import { ALERT_STATUS_LABELS, ALERT_LEVEL_LABELS, STRATEGY_STATUS_LABELS } from '../../shared/types';

interface StatusTagProps {
  type: 'alertStatus' | 'alertLevel' | 'strategyStatus' | 'subsidyStatus' | 'zoneStatus';
  value: string;
}

export const StatusTag: React.FC<StatusTagProps> = ({ type, value }) => {
  if (type === 'alertStatus') {
    const status = value as AlertStatus;
    const colorMap: Record<AlertStatus, string> = {
      PENDING: '#f5222d',
      PROCESSING: '#faad14',
      COMPLETED: '#52c41a',
      ABNORMAL_CLOSED: '#722ed1',
    };
    return <Tag color={colorMap[status]}>{ALERT_STATUS_LABELS[status]}</Tag>;
  }

  if (type === 'alertLevel') {
    const level = value as AlertLevel;
    const colorMap: Record<AlertLevel, string> = {
      INFO: '#1890ff',
      WARNING: '#faad14',
      ERROR: '#f5222d',
      CRITICAL: '#cf1322',
    };
    return <Tag color={colorMap[level]}>{ALERT_LEVEL_LABELS[level]}</Tag>;
  }

  if (type === 'strategyStatus') {
    const status = value as StrategyStatus;
    const colorMap: Record<StrategyStatus, string> = {
      ACTIVE: '#52c41a',
      INACTIVE: '#8c8c8c',
    };
    return <Tag color={colorMap[status]}>{STRATEGY_STATUS_LABELS[status]}</Tag>;
  }

  if (type === 'subsidyStatus') {
    const colorMap: Record<string, string> = {
      PENDING: '#faad14',
      APPROVED: '#1890ff',
      PAID: '#52c41a',
    };
    const labelMap: Record<string, string> = {
      PENDING: '待审核',
      APPROVED: '已审批',
      PAID: '已发放',
    };
    return <Tag color={colorMap[value]}>{labelMap[value]}</Tag>;
  }

  if (type === 'zoneStatus') {
    const colorMap: Record<string, string> = {
      NORMAL: '#52c41a',
      WARNING: '#faad14',
      ERROR: '#f5222d',
    };
    const labelMap: Record<string, string> = {
      NORMAL: '正常',
      WARNING: '告警',
      ERROR: '异常',
    };
    return <Tag color={colorMap[value]}>{labelMap[value]}</Tag>;
  }

  return <Tag>{value}</Tag>;
};

export default StatusTag;
