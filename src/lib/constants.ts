export const DECORATION_STYLES = [
  '现代简约',
  '北欧风格',
  '中式古典',
  '欧式奢华',
  '美式乡村',
  '日式禅意',
  '工业风',
  '轻奢风',
];

export const LEAD_SOURCES = [
  '线上广告',
  '小区拓客',
  '老客户转介绍',
  '展会活动',
  '抖音/短视频',
  '小红书',
  '朋友推荐',
  '门店咨询',
  '电话营销',
];

export const FOLLOWUP_METHODS = [
  { value: 'phone', label: '电话', icon: 'Phone' },
  { value: 'wechat', label: '微信', icon: 'MessageSquare' },
  { value: 'visit', label: '上门拜访', icon: 'Home' },
  { value: 'other', label: '其他', icon: 'MoreHorizontal' },
];

export const TAG_CATEGORIES = [
  { value: 'priority', label: '优先级', color: '#EF4444' },
  { value: 'customer', label: '客户特征', color: '#3B82F6' },
  { value: 'house', label: '房屋属性', color: '#8B5CF6' },
  { value: 'status', label: '跟进状态', color: '#10B981' },
];

export const ROLE_PERMISSIONS = {
  super_admin: ['all'],
  sales_manager: [
    'leads:view_all',
    'leads:assign',
    'leads:recycle',
    'pool:manage',
    'analytics:view',
    'settings:view',
  ],
  sales_consultant: [
    'leads:view_own',
    'leads:update',
    'followups:create',
    'surveys:create',
    'attachments:upload',
  ],
  analyst: [
    'analytics:view',
    'analytics:export',
    'leads:view_all',
  ],
};
