export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STAFF: 'staff',
  MEMBER: 'member',
};

export const USER_ROLE_OPTIONS = [
  { value: USER_ROLES.ADMIN, label: '管理员', color: 'red' },
  { value: USER_ROLES.MANAGER, label: '店长', color: 'orange' },
  { value: USER_ROLES.CASHIER, label: '收银员', color: 'blue' },
  { value: USER_ROLES.STAFF, label: '店员', color: 'green' },
  { value: USER_ROLES.MEMBER, label: '会员', color: 'purple' },
];

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  UNKNOWN: 'unknown',
};

export const GENDER_OPTIONS = [
  { value: GENDER.MALE, label: '男' },
  { value: GENDER.FEMALE, label: '女' },
  { value: GENDER.UNKNOWN, label: '未知' },
];

export const MEMBER_LEVELS = {
  NORMAL: '普通会员',
  SILVER: '银卡会员',
  GOLD: '金卡会员',
  PLATINUM: '铂金会员',
  DIAMOND: '钻石会员',
};

export const MEMBER_LEVEL_OPTIONS = [
  { value: MEMBER_LEVELS.NORMAL, label: '普通会员', color: 'default' },
  { value: MEMBER_LEVELS.SILVER, label: '银卡会员', color: 'gray' },
  { value: MEMBER_LEVELS.GOLD, label: '金卡会员', color: 'gold' },
  { value: MEMBER_LEVELS.PLATINUM, label: '铂金会员', color: 'geekblue' },
  { value: MEMBER_LEVELS.DIAMOND, label: '钻石会员', color: 'purple' },
];

export const BOOKING_TYPE = {
  SERVICE: 'service',
  TEST_DRIVE: 'test_drive',
  MEMBERSHIP: 'membership',
};

export const BOOKING_TYPE_OPTIONS = [
  { value: BOOKING_TYPE.SERVICE, label: '服务预约', color: 'blue' },
  { value: BOOKING_TYPE.TEST_DRIVE, label: '试驾预约', color: 'green' },
  { value: BOOKING_TYPE.MEMBERSHIP, label: '会员办理', color: 'purple' },
];

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const BOOKING_STATUS_OPTIONS = [
  { value: BOOKING_STATUS.PENDING, label: '待确认', color: 'gold' },
  { value: BOOKING_STATUS.CONFIRMED, label: '已确认', color: 'blue' },
  { value: BOOKING_STATUS.COMPLETED, label: '已完成', color: 'green' },
  { value: BOOKING_STATUS.CANCELLED, label: '已取消', color: 'gray' },
  { value: BOOKING_STATUS.NO_SHOW, label: '未到店', color: 'red' },
];

export const REMINDER_TYPE = {
  SMS: 'sms',
  WECHAT: 'wechat',
  APP: 'app',
  PHONE: 'phone',
};

export const REMINDER_TYPE_OPTIONS = [
  { value: REMINDER_TYPE.SMS, label: '短信' },
  { value: REMINDER_TYPE.WECHAT, label: '微信' },
  { value: REMINDER_TYPE.APP, label: 'APP推送' },
  { value: REMINDER_TYPE.PHONE, label: '电话' },
];

export const REMINDER_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
};

export const REMINDER_STATUS_OPTIONS = [
  { value: REMINDER_STATUS.PENDING, label: '待发送', color: 'gold' },
  { value: REMINDER_STATUS.SENT, label: '已发送', color: 'green' },
  { value: REMINDER_STATUS.FAILED, label: '发送失败', color: 'red' },
];

export const ORDER_TYPE = {
  SERVICE: 'service',
  MEMBERSHIP: 'membership',
  RECHARGE: 'recharge',
  DEPOSIT: 'deposit',
};

export const ORDER_TYPE_OPTIONS = [
  { value: ORDER_TYPE.SERVICE, label: '服务消费', color: 'blue' },
  { value: ORDER_TYPE.MEMBERSHIP, label: '会员购买', color: 'purple' },
  { value: ORDER_TYPE.RECHARGE, label: '账户充值', color: 'green' },
  { value: ORDER_TYPE.DEPOSIT, label: '押金', color: 'orange' },
];

export const PAYMENT_METHOD = {
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
  CASH: 'cash',
  CARD: 'card',
  POINTS: 'points',
  BALANCE: 'balance',
  OTHER: 'other',
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: PAYMENT_METHOD.WECHAT, label: '微信支付' },
  { value: PAYMENT_METHOD.ALIPAY, label: '支付宝' },
  { value: PAYMENT_METHOD.CASH, label: '现金' },
  { value: PAYMENT_METHOD.CARD, label: '银行卡' },
  { value: PAYMENT_METHOD.POINTS, label: '积分抵扣' },
  { value: PAYMENT_METHOD.BALANCE, label: '余额支付' },
  { value: PAYMENT_METHOD.OTHER, label: '其他' },
];

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIAL_REFUNDED: 'partial_refunded',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS_OPTIONS = [
  { value: PAYMENT_STATUS.PENDING, label: '待支付', color: 'gold' },
  { value: PAYMENT_STATUS.PAID, label: '已支付', color: 'green' },
  { value: PAYMENT_STATUS.FAILED, label: '支付失败', color: 'red' },
  { value: PAYMENT_STATUS.REFUNDED, label: '已退款', color: 'gray' },
  { value: PAYMENT_STATUS.PARTIAL_REFUNDED, label: '部分退款', color: 'orange' },
  { value: PAYMENT_STATUS.CANCELLED, label: '已取消', color: 'default' },
];

export const TRANSACTION_TYPE = {
  PAYMENT: 'payment',
  REFUND: 'refund',
  RECHARGE: 'recharge',
  WITHDRAW: 'withdraw',
};

export const TRANSACTION_TYPE_OPTIONS = [
  { value: TRANSACTION_TYPE.PAYMENT, label: '支付', color: 'blue' },
  { value: TRANSACTION_TYPE.REFUND, label: '退款', color: 'red' },
  { value: TRANSACTION_TYPE.RECHARGE, label: '充值', color: 'green' },
  { value: TRANSACTION_TYPE.WITHDRAW, label: '提现', color: 'orange' },
];

export const TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
};

export const TRANSACTION_STATUS_OPTIONS = [
  { value: TRANSACTION_STATUS.SUCCESS, label: '成功', color: 'green' },
  { value: TRANSACTION_STATUS.FAILED, label: '失败', color: 'red' },
  { value: TRANSACTION_STATUS.PENDING, label: '处理中', color: 'gold' },
];

export const CASHIER_SHIFT_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
  RECONCILED: 'reconciled',
};

export const CASHIER_SHIFT_STATUS_OPTIONS = [
  { value: CASHIER_SHIFT_STATUS.OPEN, label: '营业中', color: 'green' },
  { value: CASHIER_SHIFT_STATUS.CLOSED, label: '已交班', color: 'gold' },
  { value: CASHIER_SHIFT_STATUS.RECONCILED, label: '已对账', color: 'blue' },
];

export const BENEFIT_TYPE = {
  SERVICE: 'service',
  DISCOUNT: 'discount',
  POINTS: 'points',
  GIFT: 'gift',
  PRIORITY: 'priority',
  OTHER: 'other',
};

export const BENEFIT_TYPE_OPTIONS = [
  { value: BENEFIT_TYPE.SERVICE, label: '服务项目', color: 'blue' },
  { value: BENEFIT_TYPE.DISCOUNT, label: '折扣优惠', color: 'orange' },
  { value: BENEFIT_TYPE.POINTS, label: '积分奖励', color: 'gold' },
  { value: BENEFIT_TYPE.GIFT, label: '赠品', color: 'purple' },
  { value: BENEFIT_TYPE.PRIORITY, label: '优先权', color: 'green' },
  { value: BENEFIT_TYPE.OTHER, label: '其他', color: 'default' },
];

export const PACKAGE_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

export const PACKAGE_STATUS_OPTIONS = [
  { value: PACKAGE_STATUS.DRAFT, label: '草稿', color: 'default' },
  { value: PACKAGE_STATUS.ACTIVE, label: '上架', color: 'green' },
  { value: PACKAGE_STATUS.INACTIVE, label: '下架', color: 'gray' },
];

export const DURATION_UNIT = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
  UNLIMITED: 'unlimited',
};

export const DURATION_UNIT_OPTIONS = [
  { value: DURATION_UNIT.DAY, label: '天' },
  { value: DURATION_UNIT.MONTH, label: '月' },
  { value: DURATION_UNIT.YEAR, label: '年' },
  { value: DURATION_UNIT.UNLIMITED, label: '永久' },
];

export const MEMBER_MEMBERSHIP_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
  FROZEN: 'frozen',
};

export const MEMBER_MEMBERSHIP_STATUS_OPTIONS = [
  { value: MEMBER_MEMBERSHIP_STATUS.ACTIVE, label: '有效', color: 'green' },
  { value: MEMBER_MEMBERSHIP_STATUS.EXPIRED, label: '已过期', color: 'gray' },
  { value: MEMBER_MEMBERSHIP_STATUS.CANCELLED, label: '已取消', color: 'red' },
  { value: MEMBER_MEMBERSHIP_STATUS.FROZEN, label: '已冻结', color: 'orange' },
];

export const SERVICE_TYPE = {
  CAR_WASH: 'car_wash',
  BEAUTY: 'beauty',
  MAINTENANCE: 'maintenance',
  REPAIR: 'repair',
  TEST_DRIVE: 'test_drive',
  OTHER: 'other',
};

export const SERVICE_TYPE_OPTIONS = [
  { value: SERVICE_TYPE.CAR_WASH, label: '洗车', color: 'blue' },
  { value: SERVICE_TYPE.BEAUTY, label: '美容', color: 'purple' },
  { value: SERVICE_TYPE.MAINTENANCE, label: '保养', color: 'green' },
  { value: SERVICE_TYPE.REPAIR, label: '维修', color: 'orange' },
  { value: SERVICE_TYPE.TEST_DRIVE, label: '试驾', color: 'cyan' },
  { value: SERVICE_TYPE.OTHER, label: '其他', color: 'default' },
];

export const TEST_DRIVE_SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const TEST_DRIVE_SLOT_STATUS_OPTIONS = [
  { value: TEST_DRIVE_SLOT_STATUS.AVAILABLE, label: '可预约', color: 'green' },
  { value: TEST_DRIVE_SLOT_STATUS.BOOKED, label: '已预约', color: 'blue' },
  { value: TEST_DRIVE_SLOT_STATUS.COMPLETED, label: '已完成', color: 'purple' },
  { value: TEST_DRIVE_SLOT_STATUS.CANCELLED, label: '已取消', color: 'gray' },
];

export const SERVICE_RECORD_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const SERVICE_RECORD_STATUS_OPTIONS = [
  { value: SERVICE_RECORD_STATUS.PENDING, label: '待服务', color: 'gold' },
  { value: SERVICE_RECORD_STATUS.IN_PROGRESS, label: '服务中', color: 'blue' },
  { value: SERVICE_RECORD_STATUS.COMPLETED, label: '已完成', color: 'green' },
  { value: SERVICE_RECORD_STATUS.CANCELLED, label: '已取消', color: 'gray' },
  { value: SERVICE_RECORD_STATUS.REFUNDED, label: '已退款', color: 'red' },
];

export const CONVERSION_STAGE = {
  BOOKING: 'booking',
  ARRIVAL: 'arrival',
  SERVICE: 'service',
  PAYMENT: 'payment',
  MEMBERSHIP: 'membership',
};

export const CONVERSION_STAGE_OPTIONS = [
  { value: CONVERSION_STAGE.BOOKING, label: '预约', color: 'blue' },
  { value: CONVERSION_STAGE.ARRIVAL, label: '到店', color: 'cyan' },
  { value: CONVERSION_STAGE.SERVICE, label: '服务', color: 'green' },
  { value: CONVERSION_STAGE.PAYMENT, label: '支付', color: 'gold' },
  { value: CONVERSION_STAGE.MEMBERSHIP, label: '会员转化', color: 'purple' },
];

export const CONVERSION_REMINDER_TYPE = {
  NO_SHOW: 'no_show',
  PENDING_SERVICE: 'pending_service',
  PENDING_PAYMENT: 'pending_payment',
  FOLLOW_UP: 'follow_up',
  MEMBERSHIP_PROMOTION: 'membership_promotion',
};

export const CONVERSION_REMINDER_TYPE_OPTIONS = [
  { value: CONVERSION_REMINDER_TYPE.NO_SHOW, label: '未到店提醒', color: 'red' },
  { value: CONVERSION_REMINDER_TYPE.PENDING_SERVICE, label: '待服务提醒', color: 'gold' },
  { value: CONVERSION_REMINDER_TYPE.PENDING_PAYMENT, label: '待支付提醒', color: 'orange' },
  { value: CONVERSION_REMINDER_TYPE.FOLLOW_UP, label: '跟进提醒', color: 'blue' },
  { value: CONVERSION_REMINDER_TYPE.MEMBERSHIP_PROMOTION, label: '会员推广提醒', color: 'purple' },
];

export const REPORT_TYPE = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
};

export const REPORT_TYPE_OPTIONS = [
  { value: REPORT_TYPE.DAILY, label: '日报' },
  { value: REPORT_TYPE.WEEKLY, label: '周报' },
  { value: REPORT_TYPE.MONTHLY, label: '月报' },
];

export const BOOKING_SOURCE = {
  ONLINE: 'online',
  WECHAT: 'wechat',
  PHONE: 'phone',
  WALK_IN: 'walk_in',
  STAFF: 'staff',
};

export const BOOKING_SOURCE_OPTIONS = [
  { value: BOOKING_SOURCE.ONLINE, label: '线上预约' },
  { value: BOOKING_SOURCE.WECHAT, label: '微信预约' },
  { value: BOOKING_SOURCE.PHONE, label: '电话预约' },
  { value: BOOKING_SOURCE.WALK_IN, label: '到店预约' },
  { value: BOOKING_SOURCE.STAFF, label: '员工代约' },
];

export const DISCREPANCY_STATUS = {
  UNRESOLVED: 'unresolved',
  RESOLVED: 'resolved',
  UNDER_REVIEW: 'under_review',
};

export const DISCREPANCY_STATUS_OPTIONS = [
  { value: DISCREPANCY_STATUS.UNRESOLVED, label: '未处理', color: 'red' },
  { value: DISCREPANCY_STATUS.UNDER_REVIEW, label: '处理中', color: 'gold' },
  { value: DISCREPANCY_STATUS.RESOLVED, label: '已处理', color: 'green' },
];

export const getOptionByValue = (options, value) => {
  return options.find((opt) => opt.value === value) || null;
};

export const getLabelByValue = (options, value) => {
  const option = getOptionByValue(options, value);
  return option ? option.label : value || '-';
};

export const getColorByValue = (options, value) => {
  const option = getOptionByValue(options, value);
  return option ? option.color : 'default';
};
