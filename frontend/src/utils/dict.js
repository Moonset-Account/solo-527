export const LEAD_STATUS = {
  NEW: '新建',
  FOLLOWING: '跟进中',
  MEASURED: '已量房',
  DESIGNED: '已出方案',
  QUOTED: '已报价',
  NEGOTIATING: '洽谈中',
  DEALED: '已成交',
  LOST: '已流失',
  INVALID: '无效'
}

export const FOLLOW_STAGE = {
  INITIAL_CONTACT: '初次接触',
  DEMAND_COMMUNICATION: '需求沟通',
  HOUSE_MEASURE: '量房阶段',
  DESIGN_DRAFT: '方案设计',
  QUOTE_REVIEW: '报价审核',
  BARGAINING: '议价阶段',
  CONTRACT_READY: '准备签约',
  SIGNED: '已签约'
}

export const LEAD_SOURCE = {
  ONLINE_AD: '网络广告',
  REFERRAL: '老客户转介绍',
  EXHIBITION: '展会活动',
  COMMUNITY: '小区推广',
  TELEMARKETING: '电话营销',
  WECHAT: '微信公众号',
  DOUYIN: '抖音',
  XIAOHONGSHU: '小红书',
  WALK_IN: '门店来访',
  OTHER: '其他'
}

export const CONTRACT_STATUS = {
  DRAFT: '草稿',
  PENDING_APPROVAL: '待审批',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  SIGNED: '已签约',
  EXECUTING: '执行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

export const APPROVAL_STATUS = {
  PENDING: '待审批',
  APPROVING: '审批中',
  APPROVED: '已通过',
  REJECTED: '已驳回',
  WITHDRAWN: '已撤回'
}

export const PAYMENT_PLAN_STATUS = {
  UNPAID: '未支付',
  PARTIAL: '部分支付',
  PAID: '已支付',
  OVERDUE: '已逾期'
}

export const IMPORTANCE = {
  1: '一般',
  2: '重要',
  3: '紧急'
}

export const DECORATION_TYPE = {
  NEW_HOUSE: '新房装修',
  OLD_RENOVATION: '旧房翻新',
  PARTIAL: '局部改造',
  SOFT_OUTFIT: '软装搭配',
  COMMERCIAL: '商业空间',
  OFFICE: '办公空间'
}

export const TASK_PRIORITY = {
  1: '低',
  2: '中',
  3: '高',
  4: '紧急'
}

export const TASK_STATUS = {
  PENDING: '待处理',
  PROCESSING: '处理中',
  COMPLETED: '已完成',
  OVERDUE: '已逾期',
  CANCELLED: '已取消'
}

export const CONFLICT_FLAG = {
  '0': '无冲突',
  '1': '存在冲突'
}

export function getLeadStatusName(code) {
  return LEAD_STATUS[code] || code
}

export function getFollowStageName(code) {
  return FOLLOW_STAGE[code] || code
}

export function getLeadSourceName(code) {
  return LEAD_SOURCE[code] || code
}

export function getContractStatusName(code) {
  return CONTRACT_STATUS[code] || code
}

export function getApprovalStatusName(code) {
  return APPROVAL_STATUS[code] || code
}

export function getPaymentPlanStatusName(code) {
  return PAYMENT_PLAN_STATUS[code] || code
}

export function getImportanceName(code) {
  return code == null ? '' : IMPORTANCE[code] || String(code)
}

export function getDecorationTypeName(code) {
  return DECORATION_TYPE[code] || code
}

export function getTaskPriorityName(code) {
  return code == null ? '' : TASK_PRIORITY[code] || String(code)
}

export function getTaskStatusName(code) {
  return TASK_STATUS[code] || code
}

export function getConflictFlagName(code) {
  return CONFLICT_FLAG[code] || code
}

export function getDictOptions(dict) {
  return Object.entries(dict).map(([value, label]) => ({ value, label }))
}
