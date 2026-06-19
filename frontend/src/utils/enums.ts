import {
  UserRole,
  SpaceStatus,
  SpaceType,
  AppointmentStatus,
  ContractStatus,
  OrderStatus,
  BillStatus,
  NoShowHandleResult,
  FulfillmentStatus,
  PaymentMethod,
} from './types';

export const roleLabels: Record<UserRole, string> = {
  [UserRole.SuperAdmin]: '超级管理员',
  [UserRole.Finance]: '财务专员',
  [UserRole.ConsultantManager]: '顾问经理',
  [UserRole.Consultant]: '顾问',
  [UserRole.LandlordManager]: '房东托管经理',
  [UserRole.Customer]: '客户',
};

export const spaceStatusLabels: Record<SpaceStatus, string> = {
  [SpaceStatus.Available]: '可租',
  [SpaceStatus.Reserved]: '已预订',
  [SpaceStatus.Rented]: '已出租',
  [SpaceStatus.Maintenance]: '维护中',
  [SpaceStatus.Offline]: '已下线',
};

export const spaceStatusColors: Record<SpaceStatus, string> = {
  [SpaceStatus.Available]: 'green',
  [SpaceStatus.Reserved]: 'blue',
  [SpaceStatus.Rented]: 'geekblue',
  [SpaceStatus.Maintenance]: 'orange',
  [SpaceStatus.Offline]: 'default',
};

export const spaceTypeLabels: Record<SpaceType, string> = {
  [SpaceType.PrivateOffice]: '独立办公室',
  [SpaceType.HotDesk]: '开放工位',
  [SpaceType.DedicatedDesk]: '固定工位',
  [SpaceType.MeetingRoom]: '会议室',
  [SpaceType.EventSpace]: '活动空间',
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]: '待确认',
  [AppointmentStatus.Confirmed]: '已确认',
  [AppointmentStatus.Completed]: '已完成',
  [AppointmentStatus.Cancelled]: '已取消',
  [AppointmentStatus.NoShow]: '爽约',
};

export const appointmentStatusColors: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]: 'orange',
  [AppointmentStatus.Confirmed]: 'blue',
  [AppointmentStatus.Completed]: 'green',
  [AppointmentStatus.Cancelled]: 'default',
  [AppointmentStatus.NoShow]: 'red',
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  [ContractStatus.Draft]: '草稿',
  [ContractStatus.PendingSignature]: '待签署',
  [ContractStatus.Active]: '生效中',
  [ContractStatus.Expired]: '已过期',
  [ContractStatus.Terminated]: '已终止',
};

export const contractStatusColors: Record<ContractStatus, string> = {
  [ContractStatus.Draft]: 'default',
  [ContractStatus.PendingSignature]: 'orange',
  [ContractStatus.Active]: 'green',
  [ContractStatus.Expired]: 'gray',
  [ContractStatus.Terminated]: 'red',
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: '待支付',
  [OrderStatus.Paid]: '已支付',
  [OrderStatus.Fulfilling]: '履约中',
  [OrderStatus.Completed]: '已完成',
  [OrderStatus.Refunded]: '已退款',
  [OrderStatus.Cancelled]: '已取消',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: 'orange',
  [OrderStatus.Paid]: 'blue',
  [OrderStatus.Fulfilling]: 'cyan',
  [OrderStatus.Completed]: 'green',
  [OrderStatus.Refunded]: 'default',
  [OrderStatus.Cancelled]: 'red',
};

export const billStatusLabels: Record<BillStatus, string> = {
  [BillStatus.Unpaid]: '未付',
  [BillStatus.PartialPaid]: '部分支付',
  [BillStatus.Paid]: '已付',
  [BillStatus.Overdue]: '逾期',
  [BillStatus.Void]: '作废',
};

export const billStatusColors: Record<BillStatus, string> = {
  [BillStatus.Unpaid]: 'orange',
  [BillStatus.PartialPaid]: 'blue',
  [BillStatus.Paid]: 'green',
  [BillStatus.Overdue]: 'red',
  [BillStatus.Void]: 'default',
};

export const noShowHandleResultLabels: Record<NoShowHandleResult, string> = {
  [NoShowHandleResult.Pending]: '待处理',
  [NoShowHandleResult.Blacklisted]: '拉黑',
  [NoShowHandleResult.Warning]: '警告',
  [NoShowHandleResult.NoPenalty]: '无处罚',
  [NoShowHandleResult.DepositDeducted]: '扣除押金',
};

export const noShowHandleResultColors: Record<NoShowHandleResult, string> = {
  [NoShowHandleResult.Pending]: 'orange',
  [NoShowHandleResult.Blacklisted]: 'red',
  [NoShowHandleResult.Warning]: 'gold',
  [NoShowHandleResult.NoPenalty]: 'green',
  [NoShowHandleResult.DepositDeducted]: 'magenta',
};

export const fulfillmentStatusLabels: Record<FulfillmentStatus, string> = {
  [FulfillmentStatus.Pending]: '待处理',
  [FulfillmentStatus.InProgress]: '进行中',
  [FulfillmentStatus.Delivered]: '已交付',
  [FulfillmentStatus.Received]: '已确认',
  [FulfillmentStatus.Exception]: '异常',
};

export const fulfillmentStatusColors: Record<FulfillmentStatus, string> = {
  [FulfillmentStatus.Pending]: 'orange',
  [FulfillmentStatus.InProgress]: 'blue',
  [FulfillmentStatus.Delivered]: 'cyan',
  [FulfillmentStatus.Received]: 'green',
  [FulfillmentStatus.Exception]: 'red',
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.Alipay]: '支付宝',
  [PaymentMethod.WeChatPay]: '微信支付',
  [PaymentMethod.BankTransfer]: '银行转账',
  [PaymentMethod.Cash]: '现金',
};
