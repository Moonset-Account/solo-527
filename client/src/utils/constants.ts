export const APARTMENT_STATUS = [
  { value: 'vacant', label: '空置', color: 'bg-green-100 text-green-800' },
  { value: 'occupied', label: '已租', color: 'bg-blue-100 text-blue-800' },
  { value: 'reserved', label: '预留', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'maintenance', label: '维修', color: 'bg-red-100 text-red-800' },
  { value: 'offline', label: '下架', color: 'bg-gray-100 text-gray-800' },
];

export const VIEWING_STATUS = [
  { value: 'pending', label: '待看房', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: '已取消', color: 'bg-gray-100 text-gray-800' },
  { value: 'no_show', label: '爽约', color: 'bg-red-100 text-red-800' },
];

export const FOLLOWUP_TYPE = [
  { value: 'phone', label: '电话' },
  { value: 'wechat', label: '微信' },
  { value: 'visit', label: '到访' },
  { value: 'other', label: '其他' },
];

export const FOLLOWUP_RESULT = [
  { value: 'interested', label: '意向强' },
  { value: 'negotiating', label: '洽谈中' },
  { value: 'signed', label: '已签约' },
  { value: 'lost', label: '已流失' },
  { value: 'pending', label: '待跟进' },
];

export const LEASE_STATUS = [
  { value: 'active', label: '履行中', color: 'bg-green-100 text-green-800' },
  { value: 'expired', label: '已到期', color: 'bg-gray-100 text-gray-800' },
  { value: 'terminated', label: '已终止', color: 'bg-red-100 text-red-800' },
  { value: 'draft', label: '草稿', color: 'bg-yellow-100 text-yellow-800' },
];

export const DEPOSIT_STATUS = [
  { value: 'held', label: '托管中', color: 'bg-blue-100 text-blue-800' },
  { value: 'refunded', label: '已退还', color: 'bg-green-100 text-green-800' },
  { value: 'partial_refund', label: '部分退还', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'deducted', label: '已扣除', color: 'bg-red-100 text-red-800' },
];

export const DISPUTE_STATUS = [
  { value: 'pending', label: '待处理', color: 'bg-red-100 text-red-800' },
  { value: 'processing', label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'closed', label: '已关闭', color: 'bg-green-100 text-green-800' },
];

export const TODO_PRIORITY = [
  { value: 'high', label: '高', color: 'bg-red-100 text-red-800' },
  { value: 'normal', label: '中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'low', label: '低', color: 'bg-green-100 text-green-800' },
];

export const TODO_STATUS = [
  { value: 'pending', label: '待处理', color: 'bg-red-100 text-red-800' },
  { value: 'processing', label: '处理中', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: '已完成', color: 'bg-green-100 text-green-800' },
];

export const getStatusLabel = (status: string, list: Array<{ value: string; label: string }>) => {
  return list.find((s) => s.value === status)?.label || status;
};

export const getStatusColor = (status: string, list: Array<{ value: string; color?: string }>) => {
  return list.find((s) => s.value === status)?.color || 'bg-gray-100 text-gray-800';
};
