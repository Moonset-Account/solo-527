export const STATUS_MAP: Record<string, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  ACTIVE: { text: '启用', color: 'success' },
  INACTIVE: { text: '禁用', color: 'default' },
  PENDING: { text: '待处理', color: 'warning' },
  PAID: { text: '已支付', color: 'success' },
  CANCELLED: { text: '已取消', color: 'default' },
  REFUNDED: { text: '已退款', color: 'default' },
  IN_PROGRESS: { text: '学习中', color: 'processing' },
  COMPLETED: { text: '已完成', color: 'success' },
  SUBMITTED: { text: '已提交', color: 'processing' },
  REVIEWED: { text: '已点评', color: 'success' },
  SETTLED: { text: '已结算', color: 'success' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' },
  RUNNING: { text: '进行中', color: 'processing' },
  ENDED: { text: '已结束', color: 'default' },
};

export const BIZ_TYPE_MAP: Record<string, string> = {
  COURSE: '课程',
  CLASS: '班级',
  ORDER: '订单',
  PROGRESS: '学习进度',
  COUPON: '优惠券',
  REFUND: '退款申请',
  ASSIGNMENT: '作业',
  COMMISSION: '佣金',
};
