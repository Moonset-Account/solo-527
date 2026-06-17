import React from 'react';
import { Tag } from 'antd';
import type { AlertLevel, AlertStatus, BatchStatus, MaterialStatus, OrderStatus, OperationStatus } from '../../types';

type StatusTagType = 'batch' | 'alert' | 'material' | 'order' | 'alertLevel' | 'operation';

interface StatusTagProps {
  type: StatusTagType;
  status: string;
}

const batchStatusMap: Record<BatchStatus, { color: string; label: string }> = {
  Pending: { color: 'default', label: '待采收' },
  Harvesting: { color: 'processing', label: '采收中' },
  Completed: { color: 'success', label: '已完成' },
  Cancelled: { color: 'error', label: '已取消' },
};

const alertStatusMap: Record<AlertStatus, { color: string; label: string }> = {
  Active: { color: 'red', label: '活跃' },
  Acknowledged: { color: 'orange', label: '已确认' },
  Resolved: { color: 'green', label: '已解决' },
};

const alertLevelMap: Record<AlertLevel, { color: string; label: string }> = {
  Info: { color: 'blue', label: '信息' },
  Warning: { color: 'orange', label: '警告' },
  Critical: { color: 'red', label: '严重' },
};

const materialStatusMap: Record<MaterialStatus, { color: string; label: string }> = {
  Missing: { color: 'default', label: '缺失' },
  Submitted: { color: 'processing', label: '已提交' },
  Approved: { color: 'success', label: '已通过' },
  Rejected: { color: 'error', label: '已驳回' },
};

const orderStatusMap: Record<OrderStatus, { color: string; label: string }> = {
  Created: { color: 'default', label: '已创建' },
  Fulfilling: { color: 'processing', label: '履约中' },
  Fulfilled: { color: 'success', label: '已履约' },
  Overdue: { color: 'error', label: '已逾期' },
};

const operationStatusMap: Record<OperationStatus, { color: string; label: string }> = {
  Success: { color: 'success', label: '全部成功' },
  Failed: { color: 'error', label: '全部失败' },
  PartialSuccess: { color: 'warning', label: '部分成功' },
};

const getStatusConfig = (type: StatusTagType, status: string) => {
  switch (type) {
    case 'batch':
      return batchStatusMap[status as BatchStatus] || { color: 'default', label: status };
    case 'alert':
      return alertStatusMap[status as AlertStatus] || { color: 'default', label: status };
    case 'material':
      return materialStatusMap[status as MaterialStatus] || { color: 'default', label: status };
    case 'order':
      return orderStatusMap[status as OrderStatus] || { color: 'default', label: status };
    case 'alertLevel':
      return alertLevelMap[status as AlertLevel] || { color: 'default', label: status };
    case 'operation':
      return operationStatusMap[status as OperationStatus] || { color: 'default', label: status };
    default:
      return { color: 'default', label: status };
  }
};

const StatusTag: React.FC<StatusTagProps> = ({ type, status }) => {
  const config = getStatusConfig(type, status);
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default StatusTag;
