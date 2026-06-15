
import dayjs from 'dayjs';
import {
  OrderStatus,
  ProductionStatus,
  EquipmentStatus,
  InspectionResult,
  QualityIssueStatus,
  DeliveryStatus,
  BatchItemStatus,
  BatchOperationStatus
} from '@/types';

export const formatDate = (date: string | Date | null | undefined, format: string = 'YYYY-MM-DD') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date | null | undefined) => {
  return formatDate(date, 'YYYY-MM-DD HH:mm:ss');
};

export const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined) return '-';
  return `¥${value.toFixed(2)}`;
};

export const getOrderStatusText = (status: OrderStatus) => {
  const statusMap: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: '待处理',
    [OrderStatus.InProduction]: '生产中',
    [OrderStatus.QualityInspecting]: '质检中',
    [OrderStatus.QualityFailed]: '质检不合格',
    [OrderStatus.Completed]: '已完成',
    [OrderStatus.Delivered]: '已交付',
    [OrderStatus.Cancelled]: '已取消'
  };
  return statusMap[status] || status;
};

export const getOrderStatusColor = (status: OrderStatus) => {
  const colorMap: Record<OrderStatus, string> = {
    [OrderStatus.Pending]: 'default',
    [OrderStatus.InProduction]: 'processing',
    [OrderStatus.QualityInspecting]: 'warning',
    [OrderStatus.QualityFailed]: 'error',
    [OrderStatus.Completed]: 'success',
    [OrderStatus.Delivered]: 'success',
    [OrderStatus.Cancelled]: 'default'
  };
  return colorMap[status] || 'default';
};

export const getProductionStatusText = (status: ProductionStatus) => {
  const statusMap: Record<ProductionStatus, string> = {
    [ProductionStatus.NotStarted]: '未开始',
    [ProductionStatus.InProgress]: '进行中',
    [ProductionStatus.Paused]: '已暂停',
    [ProductionStatus.Completed]: '已完成',
    [ProductionStatus.Skipped]: '已跳过'
  };
  return statusMap[status] || status;
};

export const getProductionStatusColor = (status: ProductionStatus) => {
  const colorMap: Record<ProductionStatus, string> = {
    [ProductionStatus.NotStarted]: 'default',
    [ProductionStatus.InProgress]: 'processing',
    [ProductionStatus.Paused]: 'warning',
    [ProductionStatus.Completed]: 'success',
    [ProductionStatus.Skipped]: 'default'
  };
  return colorMap[status] || 'default';
};

export const getEquipmentStatusText = (status: EquipmentStatus) => {
  const statusMap: Record<EquipmentStatus, string> = {
    [EquipmentStatus.Idle]: '空闲',
    [EquipmentStatus.InUse]: '使用中',
    [EquipmentStatus.Maintenance]: '维护中',
    [EquipmentStatus.Faulty]: '故障',
    [EquipmentStatus.Offline]: '离线'
  };
  return statusMap[status] || status;
};

export const getEquipmentStatusColor = (status: EquipmentStatus) => {
  const colorMap: Record<EquipmentStatus, string> = {
    [EquipmentStatus.Idle]: 'success',
    [EquipmentStatus.InUse]: 'processing',
    [EquipmentStatus.Maintenance]: 'warning',
    [EquipmentStatus.Faulty]: 'error',
    [EquipmentStatus.Offline]: 'default'
  };
  return colorMap[status] || 'default';
};

export const getInspectionResultText = (result: InspectionResult) => {
  const resultMap: Record<InspectionResult, string> = {
    [InspectionResult.Pass]: '合格',
    [InspectionResult.Fail]: '不合格',
    [InspectionResult.PartialPass]: '部分合格',
    [InspectionResult.Pending]: '待检验'
  };
  return resultMap[result] || result;
};

export const getInspectionResultColor = (result: InspectionResult) => {
  const colorMap: Record<InspectionResult, string> = {
    [InspectionResult.Pass]: 'success',
    [InspectionResult.Fail]: 'error',
    [InspectionResult.PartialPass]: 'warning',
    [InspectionResult.Pending]: 'default'
  };
  return colorMap[result] || 'default';
};

export const getQualityIssueStatusText = (status: QualityIssueStatus) => {
  const statusMap: Record<QualityIssueStatus, string> = {
    [QualityIssueStatus.Open]: '待处理',
    [QualityIssueStatus.Investigating]: '调查中',
    [QualityIssueStatus.Handling]: '处理中',
    [QualityIssueStatus.Reviewed]: '已复核',
    [QualityIssueStatus.Closed]: '已关闭'
  };
  return statusMap[status] || status;
};

export const getDeliveryStatusText = (status: DeliveryStatus) => {
  const statusMap: Record<DeliveryStatus, string> = {
    [DeliveryStatus.Pending]: '待安排',
    [DeliveryStatus.Scheduled]: '已排期',
    [DeliveryStatus.InTransit]: '运输中',
    [DeliveryStatus.Delivered]: '已送达',
    [DeliveryStatus.Returned]: '已退回',
    [DeliveryStatus.Failed]: '交付失败'
  };
  return statusMap[status] || status;
};

export const getBatchItemStatusText = (status: BatchItemStatus) => {
  const statusMap: Record<BatchItemStatus, string> = {
    [BatchItemStatus.Pending]: '待处理',
    [BatchItemStatus.Processing]: '处理中',
    [BatchItemStatus.Success]: '成功',
    [BatchItemStatus.Failed]: '失败'
  };
  return statusMap[status] || status;
};

export const getBatchItemStatusColor = (status: BatchItemStatus) => {
  const colorMap: Record<BatchItemStatus, string> = {
    [BatchItemStatus.Pending]: 'default',
    [BatchItemStatus.Processing]: 'processing',
    [BatchItemStatus.Success]: 'success',
    [BatchItemStatus.Failed]: 'error'
  };
  return colorMap[status] || 'default';
};

export const getBatchOperationStatusText = (status: BatchOperationStatus) => {
  const statusMap: Record<BatchOperationStatus, string> = {
    [BatchOperationStatus.Pending]: '待确认',
    [BatchOperationStatus.Confirmed]: '已确认',
    [BatchOperationStatus.Processing]: '处理中',
    [BatchOperationStatus.Completed]: '已完成',
    [BatchOperationStatus.PartiallyCompleted]: '部分完成',
    [BatchOperationStatus.Cancelled]: '已取消'
  };
  return statusMap[status] || status;
};

export const getReminderLevelText = (level: string) => {
  const levelMap: Record<string, string> = {
    critical: '紧急',
    high: '高',
    medium: '中',
    low: '低',
    normal: '正常'
  };
  return levelMap[level] || level;
};

export const getReminderLevelColor = (level: string) => {
  const colorMap: Record<string, string> = {
    critical: 'error',
    high: 'warning',
    medium: 'warning',
    low: 'processing',
    normal: 'default'
  };
  return colorMap[level] || 'default';
};

export const getStatusText = getOrderStatusText;
export const getStatusColor = getOrderStatusColor;
