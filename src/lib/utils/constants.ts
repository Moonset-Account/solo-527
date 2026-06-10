export const EXCEPTION_TYPES = [
  { value: 'material_discrepancy', label: '物资差异' },
  { value: 'budget_overrun', label: '预算超支' },
  { value: 'other', label: '其他异常' },
] as const;

export const EXCEPTION_STATUSES = [
  { value: 'pending', label: '待处理' },
  { value: 'investigating', label: '调查中' },
  { value: 'handling', label: '处理中' },
  { value: 'closed', label: '已关闭' },
] as const;

export const REVIEW_STATUSES = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
] as const;

export const VISIT_STATUSES = [
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'published', label: '已发布' },
] as const;

export const FEEDBACK_TYPES = [
  { value: 'story', label: '学生故事' },
  { value: 'letter', label: '感谢信' },
  { value: 'grade', label: '成绩反馈' },
] as const;

export const SITE_SETTING_KEYS = {
  PROJECT_NAME: 'project_name',
  PROJECT_SLOGAN: 'project_slogan',
  TOTAL_RAISED: 'total_raised',
  BENEFICIARY_COUNT: 'beneficiary_count',
  SERVICE_HOURS: 'service_hours',
  ACHIEVEMENT_PHOTOS: 'achievement_photos',
  PROJECT_BUDGET: 'project_budget',
  PROJECT_START_DATE: 'project_start_date',
} as const;

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: '仪表盘', icon: 'LayoutDashboard' },
  { href: '/admin/budget', label: '预算管理', icon: 'Wallet' },
  { href: '/admin/visits', label: '探访记录', icon: 'MapPin' },
  { href: '/admin/photos', label: '照片审核', icon: 'Image' },
  { href: '/admin/donations', label: '捐赠明细', icon: 'Heart' },
  { href: '/admin/exceptions', label: '异常处理', icon: 'AlertTriangle' },
  { href: '/admin/settings', label: '系统设置', icon: 'Settings' },
] as const;

export const PUBLIC_NAV_ITEMS = [
  { href: '/', label: '首页' },
  { href: '/progress', label: '项目进展' },
  { href: '/finance', label: '资金使用' },
  { href: '/feedback', label: '受助反馈' },
] as const;
