export const RISK_LEVELS = [
  { value: 'LOW', label: '低风险', color: 'bg-green-500' },
  { value: 'MEDIUM', label: '中风险', color: 'bg-amber-500' },
  { value: 'HIGH', label: '高风险', color: 'bg-red-500' },
  { value: 'CRITICAL', label: '严重风险', color: 'bg-purple-600' },
] as const;

export const RISK_STATUSES = [
  { value: 'DRAFT', label: '草稿' },
  { value: 'SUBMITTED', label: '已提交' },
  { value: 'UNDER_REVIEW', label: '审核中' },
  { value: 'RECTIFICATION', label: '整改中' },
  { value: 'CLOSED', label: '已闭环' },
  { value: 'ESCALATED', label: '已升级' },
] as const;

export const USER_ROLES = [
  { value: 'BUSINESS', label: '业务部门', description: '填写检查清单' },
  { value: 'LEGAL', label: '法务', description: '风险评估与管理' },
  { value: 'PRO_BONO_LAWYER', label: '公益律师', description: '越权提醒处理' },
  { value: 'ADMIN', label: '管理员', description: '系统管理' },
] as const;

export const DEPARTMENTS = [
  { value: 'MARKETING', label: '市场部' },
  { value: 'SALES', label: '销售部' },
  { value: 'HR', label: '人力资源部' },
  { value: 'FINANCE', label: '财务部' },
  { value: 'IT', label: '信息技术部' },
  { value: 'OPERATIONS', label: '运营部' },
  { value: 'LEGAL', label: '法务部' },
  { value: 'COMPLIANCE', label: '合规部' },
] as const;

export const CHECKLIST_CATEGORIES = [
  { value: 'DATA_PRIVACY', label: '数据隐私' },
  { value: 'DATA_SECURITY', label: '数据安全' },
  { value: 'CONTRACT_COMPLIANCE', label: '合同合规' },
  { value: 'REGULATORY', label: '监管合规' },
  { value: 'ACCESS_CONTROL', label: '访问控制' },
  { value: 'DATA_RETENTION', label: '数据留存' },
] as const;
