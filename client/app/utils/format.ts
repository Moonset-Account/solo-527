import dayjs from 'dayjs';

export const formatDate = (date: any, format: string = 'YYYY-MM-DD HH:mm:ss') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

export const formatMoney = (value: number, symbol: string = '¥') => {
  if (value === undefined || value === null) return '-';
  return `${symbol}${value.toFixed(2)}`;
};

export const formatPercent = (value: number, decimals: number = 2) => {
  if (value === undefined || value === null) return '-';
  return `${value.toFixed(decimals)}%`;
};

export const getStatusTag = (status: string) => {
  const statusMap: Record<string, { text: string; type: string }> = {
    active: { text: '启用', type: 'tag-success' },
    inactive: { text: '禁用', type: 'tag-default' },
    reported: { text: '已上报', type: 'tag-warning' },
    in_progress: { text: '处理中', type: 'tag-info' },
    resolved: { text: '已解决', type: 'tag-success' },
    closed: { text: '已关闭', type: 'tag-default' },
    pending: { text: '待处理', type: 'tag-warning' },
    submitted: { text: '待审核', type: 'tag-info' },
    approved: { text: '已通过', type: 'tag-success' },
    rejected: { text: '已驳回', type: 'tag-danger' },
    normal: { text: '正常', type: 'tag-success' },
    low: { text: '库存低', type: 'tag-warning' },
    out_of_stock: { text: '缺货', type: 'tag-danger' },
    expired: { text: '已过期', type: 'tag-danger' },
    draft: { text: '草稿', type: 'tag-default' },
    used_up: { text: '已用完', type: 'tag-warning' },
    scheduled: { text: '已排期', type: 'tag-info' },
    completed: { text: '已完成', type: 'tag-success' },
    overdue: { text: '已逾期', type: 'tag-danger' },
    cancelled: { text: '已取消', type: 'tag-default' },
    read: { text: '已读', type: 'tag-default' },
    processed: { text: '已处理', type: 'tag-success' },
    dismissed: { text: '已忽略', type: 'tag-default' },
    adjusted: { text: '已调整', type: 'tag-success' },
    investigated: { text: '已调查', type: 'tag-info' },
    written_off: { text: '已核销', type: 'tag-warning' },
    recovered: { text: '已追回', type: 'tag-success' },
    over: { text: '长款', type: 'tag-success' },
    short: { text: '短款', type: 'tag-danger' },
    balanced: { text: '一致', type: 'tag-success' },
  };
  return statusMap[status] || { text: status, type: 'tag-default' };
};

export const getPriorityTag = (priority: string) => {
  const priorityMap: Record<string, { text: string; type: string }> = {
    low: { text: '低', type: 'tag-default' },
    medium: { text: '中', type: 'tag-warning' },
    high: { text: '高', type: 'tag-danger' },
    urgent: { text: '紧急', type: 'tag-danger' },
  };
  return priorityMap[priority] || { text: priority, type: 'tag-default' };
};

export const getRoleName = (role: string) => {
  const roleMap: Record<string, string> = {
    admin: '系统管理员',
    manager: '区域经理',
    store_manager: '门店店长',
    staff: '普通员工',
  };
  return roleMap[role] || role;
};

export const getTypeName = (type: string, category: string) => {
  const typeMaps: Record<string, Record<string, string>> = {
    anomaly: {
      service: '服务',
      hygiene: '卫生',
      equipment: '设备',
      inventory: '库存',
      cash: '现金',
      other: '其他',
    },
    coupon: {
      discount: '折扣券',
      cash: '代金券',
      gift: '赠品券',
      points: '积分券',
    },
    inventory: {
      tea_leaf: '茶叶',
      milk: '奶制品',
      sugar: '糖类',
      topping: '小料',
      fruit: '水果',
      packaging: '包材',
      other: '其他',
    },
    inspection: {
      daily: '日常巡检',
      weekly: '周度检查',
      monthly: '月度检查',
      special: '专项检查',
      random: '随机抽查',
    },
    shift: {
      morning: '早班',
      afternoon: '中班',
      evening: '晚班',
      all_day: '全天',
    },
    cashReason: {
      change_error: '找零错误',
      register_error: '收银机故障',
      theft: '偷盗',
      discount: '折扣',
      refund: '退款',
      other: '其他',
    },
  };
  return typeMaps[category]?.[type] || type;
};
