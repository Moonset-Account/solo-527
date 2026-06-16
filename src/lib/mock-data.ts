import { User, LeadStage, LeadTag, Lead, FollowUpRecord, SurveyRecord, ContractAttachment, ChangeLog, RevisitRecord, DashboardStats } from './types';
import { generateId } from './utils';

const now = new Date().toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000).toISOString();
const daysLater = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000).toISOString();

export const mockUsers: User[] = [
  { id: 'user-admin', email: 'admin@deco.com', name: '系统管理员', role: 'super_admin', is_active: true, created_at: daysAgo(180) },
  { id: 'user-manager1', email: 'manager1@deco.com', name: '张明远', role: 'sales_manager', is_active: true, created_at: daysAgo(150) },
  { id: 'user-manager2', email: 'manager2@deco.com', name: '李婷婷', role: 'sales_manager', is_active: true, created_at: daysAgo(120) },
  { id: 'user-consultant1', email: 'c1@deco.com', name: '王浩然', role: 'sales_consultant', is_active: true, created_at: daysAgo(100) },
  { id: 'user-consultant2', email: 'c2@deco.com', name: '陈雪琪', role: 'sales_consultant', is_active: true, created_at: daysAgo(90) },
  { id: 'user-consultant3', email: 'c3@deco.com', name: '刘建国', role: 'sales_consultant', is_active: true, created_at: daysAgo(80) },
  { id: 'user-consultant4', email: 'c4@deco.com', name: '赵梦琪', role: 'sales_consultant', is_active: true, created_at: daysAgo(60) },
  { id: 'user-analyst1', email: 'a1@deco.com', name: '孙文博', role: 'analyst', is_active: true, created_at: daysAgo(70) },
];

export const mockStages: LeadStage[] = [
  { id: 'stage-pool', name: '公海池', color: '#9CA3AF', order: 0, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-assign', name: '待分配', color: '#F59E0B', order: 1, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-follow', name: '跟进中', color: '#3B82F6', order: 2, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-survey', name: '已量房', color: '#8B5CF6', order: 3, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-quote', name: '报价中', color: '#EC4899', order: 4, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-contract', name: '签约中', color: '#10B981', order: 5, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-won', name: '已成交', color: '#059669', order: 6, is_active: true, updated_at: daysAgo(200) },
  { id: 'stage-lost', name: '已流失', color: '#EF4444', order: 7, is_active: true, updated_at: daysAgo(200) },
];

export const mockTags: LeadTag[] = [
  { id: 'tag-1', name: '高意向', color: '#EF4444', category: 'priority' },
  { id: 'tag-2', name: '中意向', color: '#F59E0B', category: 'priority' },
  { id: 'tag-3', name: '低意向', color: '#9CA3AF', category: 'priority' },
  { id: 'tag-4', name: '全款客户', color: '#10B981', category: 'customer' },
  { id: 'tag-5', name: '贷款客户', color: '#3B82F6', category: 'customer' },
  { id: 'tag-6', name: '学区房', color: '#8B5CF6', category: 'house' },
  { id: 'tag-7', name: '婚房', color: '#EC4899', category: 'house' },
  { id: 'tag-8', name: '改善型', color: '#0891B2', category: 'house' },
  { id: 'tag-9', name: '急单', color: '#DC2626', category: 'status' },
  { id: 'tag-10', name: '需二次跟进', color: '#0EA5E9', category: 'status' },
];

export const mockLeads: Lead[] = [
  {
    id: 'lead-1', customer_name: '周先生', phone: '13800138001', community: '万科翡翠公园',
    area: 128, budget_min: 200000, budget_max: 280000, style: '现代简约', source: '线上广告',
    stage_id: 'stage-contract', assignee_id: 'user-consultant1', assignee_name: '王浩然',
    tags: ['tag-1', 'tag-4', 'tag-9'], remark: '客户比较关注环保材料，预算充足',
    is_in_pool: false, created_at: daysAgo(25), updated_at: hoursAgo(4),
  },
  {
    id: 'lead-2', customer_name: '吴女士', phone: '13800138002', community: '碧桂园天玺湾',
    area: 156, budget_min: 350000, budget_max: 450000, style: '轻奢风', source: '老客户转介绍',
    stage_id: 'stage-quote', assignee_id: 'user-consultant2', assignee_name: '陈雪琪',
    tags: ['tag-1', 'tag-4'], remark: '上周已量房，客户对设计方案比较满意',
    is_in_pool: false, created_at: daysAgo(18), updated_at: hoursAgo(8),
  },
  {
    id: 'lead-3', customer_name: '林先生', phone: '13800138003', community: '保利中央公园',
    area: 89, budget_min: 100000, budget_max: 150000, style: '北欧风格', source: '小区拓客',
    stage_id: 'stage-follow', assignee_id: 'user-consultant3', assignee_name: '刘建国',
    tags: ['tag-2', 'tag-5', 'tag-7'], remark: '准备结婚用的婚房，年轻人',
    is_in_pool: false, created_at: daysAgo(12), updated_at: hoursAgo(26),
  },
  {
    id: 'lead-4', customer_name: '郑女士', phone: '13800138004', community: '龙湖原著',
    area: 220, budget_min: 600000, budget_max: 800000, style: '中式古典', source: '抖音/短视频',
    stage_id: 'stage-survey', assignee_id: 'user-consultant1', assignee_name: '王浩然',
    tags: ['tag-1', 'tag-4', 'tag-8'], remark: '大别墅，客户要求很高，需安排资深设计师',
    is_in_pool: false, created_at: daysAgo(9), updated_at: hoursAgo(15),
  },
  {
    id: 'lead-5', customer_name: '孙先生', phone: '13800138005', community: '华润置地橡树湾',
    area: 105, budget_min: 150000, budget_max: 200000, style: '现代简约', source: '小红书',
    stage_id: 'stage-follow', assignee_id: 'user-consultant4', assignee_name: '赵梦琪',
    tags: ['tag-2', 'tag-5'], remark: '客户在对比三家装修公司',
    is_in_pool: false, created_at: daysAgo(7), updated_at: hoursAgo(50),
  },
  {
    id: 'lead-6', customer_name: '马女士', phone: '13800138006', community: '中海国际社区',
    area: 140, budget_min: 280000, budget_max: 350000, style: '美式乡村', source: '朋友推荐',
    stage_id: 'stage-won', assignee_id: 'user-consultant2', assignee_name: '陈雪琪',
    tags: ['tag-1', 'tag-4'], remark: '已签合同，等客户首付到账',
    is_in_pool: false, created_at: daysAgo(35), updated_at: daysAgo(2),
  },
  {
    id: 'lead-7', customer_name: '韩先生', phone: '13800138007', community: '绿地中央广场',
    area: 78, budget_min: 80000, budget_max: 120000, style: '日式禅意', source: '门店咨询',
    stage_id: 'stage-assign', assignee_id: undefined,
    tags: ['tag-3'], remark: '首次咨询，预算有限',
    is_in_pool: false, created_at: daysAgo(2), updated_at: hoursAgo(36),
  },
  {
    id: 'lead-8', customer_name: '黄女士', phone: '13800138008', community: '融创文旅城',
    area: 118, budget_min: 180000, budget_max: 250000, style: '工业风', source: '展会活动',
    stage_id: 'stage-pool', assignee_id: undefined,
    tags: ['tag-2', 'tag-6'],
    is_in_pool: true, created_at: hoursAgo(12), updated_at: hoursAgo(12),
  },
  {
    id: 'lead-9', customer_name: '朱先生', phone: '13800138009', community: '金地自在城',
    area: 95, budget_min: 120000, budget_max: 180000, style: '现代简约', source: '电话营销',
    stage_id: 'stage-pool', assignee_id: undefined,
    tags: ['tag-3'],
    is_in_pool: true, created_at: hoursAgo(5), updated_at: hoursAgo(5),
  },
  {
    id: 'lead-10', customer_name: '徐女士', phone: '13800138010', community: '招商依云郡',
    area: 135, budget_min: 250000, budget_max: 320000, style: '欧式奢华', source: '线上广告',
    stage_id: 'stage-lost', assignee_id: 'user-consultant3', assignee_name: '刘建国',
    tags: ['tag-2'], remark: '客户选择了竞品公司',
    is_in_pool: false, created_at: daysAgo(45), updated_at: daysAgo(10),
  },
  {
    id: 'lead-11', customer_name: '何先生', phone: '13800138011', community: '恒大雅苑',
    area: 110, budget_min: 160000, budget_max: 220000, style: '现代简约', source: '线上广告',
    stage_id: 'stage-follow', assignee_id: 'user-consultant1', assignee_name: '王浩然',
    tags: ['tag-2', 'tag-5', 'tag-10'], remark: '客户说再考虑考虑，需二次跟进',
    is_in_pool: false, created_at: daysAgo(15), updated_at: hoursAgo(72), auto_recycle_at: daysLater(1),
  },
  {
    id: 'lead-12', customer_name: '高女士', phone: '13800138012', community: '星河湾',
    area: 180, budget_min: 450000, budget_max: 600000, style: '轻奢风', source: '老客户转介绍',
    stage_id: 'stage-quote', assignee_id: 'user-consultant4', assignee_name: '赵梦琪',
    tags: ['tag-1', 'tag-4', 'tag-8'], remark: '高端客户，注重品质与细节',
    is_in_pool: false, created_at: daysAgo(20), updated_at: hoursAgo(20),
  },
];

export const mockFollowUps: FollowUpRecord[] = [
  {
    id: 'fu-1', lead_id: 'lead-1', follow_up_time: hoursAgo(4), method: 'phone',
    content: '已确认签约时间，明天下午来门店签合同，带身份证和银行卡',
    next_follow_up_at: daysLater(1), created_by: 'user-consultant1', created_by_name: '王浩然', created_at: hoursAgo(4),
  },
  {
    id: 'fu-2', lead_id: 'lead-1', follow_up_time: daysAgo(2), method: 'visit',
    content: '上门拜访，带了设计方案和材料样品，客户对方案非常满意，约定周末来店谈合同细节',
    created_by: 'user-consultant1', created_by_name: '王浩然', created_at: daysAgo(2),
  },
  {
    id: 'fu-3', lead_id: 'lead-1', follow_up_time: daysAgo(5), method: 'wechat',
    content: '发送了初步设计效果图，客户反馈不错，需要调整客厅布局',
    created_by: 'user-consultant1', created_by_name: '王浩然', created_at: daysAgo(5),
  },
  {
    id: 'fu-4', lead_id: 'lead-2', follow_up_time: hoursAgo(8), method: 'phone',
    content: '报价方案已发送，客户说明天给答复',
    next_follow_up_at: daysLater(1), created_by: 'user-consultant2', created_by_name: '陈雪琪', created_at: hoursAgo(8),
  },
  {
    id: 'fu-5', lead_id: 'lead-3', follow_up_time: hoursAgo(26), method: 'wechat',
    content: '确认量房时间，客户要求周末上午',
    next_follow_up_at: daysLater(3), created_by: 'user-consultant3', created_by_name: '刘建国', created_at: hoursAgo(26),
  },
  {
    id: 'fu-6', lead_id: 'lead-4', follow_up_time: hoursAgo(15), method: 'visit',
    content: '量房完成，房屋结构比较复杂，需要设计师重点关注客厅挑高部分',
    created_by: 'user-consultant1', created_by_name: '王浩然', created_at: hoursAgo(15),
  },
  {
    id: 'fu-7', lead_id: 'lead-5', follow_up_time: hoursAgo(50), method: 'phone',
    content: '客户说还在对比，等消息',
    next_follow_up_at: daysLater(2), created_by: 'user-consultant4', created_by_name: '赵梦琪', created_at: hoursAgo(50),
  },
  {
    id: 'fu-8', lead_id: 'lead-11', follow_up_time: hoursAgo(72), method: 'phone',
    content: '客户表示预算有限，需要再考虑，约定一周后回访',
    created_by: 'user-consultant1', created_by_name: '王浩然', created_at: hoursAgo(72),
  },
];

export const mockSurveys: SurveyRecord[] = [
  {
    id: 'survey-1', lead_id: 'lead-1', survey_time: daysAgo(8),
    surveyor_id: 'user-consultant1', surveyor_name: '王浩然',
    photos: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400',
    ],
    measurements: { '客厅面积': 35, '主卧面积': 18, '次卧面积': 12, '厨房面积': 8, '卫生间面积': 5, '阳台面积': 6 },
    customer_notes: '客厅要做吊顶，主卧需要衣帽间，厨房要开放式',
    created_at: daysAgo(8),
  },
  {
    id: 'survey-2', lead_id: 'lead-2', survey_time: daysAgo(10),
    surveyor_id: 'user-consultant2', surveyor_name: '陈雪琪',
    photos: [
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400',
    ],
    measurements: { '客厅面积': 42, '主卧面积': 22, '次卧面积': 15, '书房面积': 10, '厨房面积': 12, '卫生间面积': 8 },
    customer_notes: '要做奢华风，预算充裕，注重品质和品牌',
    created_at: daysAgo(10),
  },
  {
    id: 'survey-3', lead_id: 'lead-4', survey_time: daysAgo(2),
    surveyor_id: 'user-consultant1', surveyor_name: '王浩然',
    photos: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400',
      'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400',
    ],
    measurements: { '一层客厅': 55, '一层餐厅': 25, '一层厨房': 18, '二层主卧': 35, '二层次卧': 20, '三层书房': 28 },
    customer_notes: '别墅客户，中式古典风格，需要红木家具搭配，花园也要设计',
    created_at: daysAgo(2),
  },
];

export const mockAttachments: ContractAttachment[] = [
  {
    id: 'att-1', lead_id: 'lead-1', file_name: '装修合同-周先生-V2.docx',
    file_url: '#', file_size: 245760, version: 2,
    uploaded_by: 'user-consultant1', uploaded_by_name: '王浩然', created_at: hoursAgo(4),
  },
  {
    id: 'att-2', lead_id: 'lead-1', file_name: '设计方案-翡翠公园.pdf',
    file_url: '#', file_size: 3670016, version: 1,
    uploaded_by: 'user-consultant1', uploaded_by_name: '王浩然', created_at: daysAgo(3),
  },
  {
    id: 'att-3', lead_id: 'lead-6', file_name: '装修施工合同-马女士.pdf',
    file_url: '#', file_size: 1024000, version: 1,
    uploaded_by: 'user-consultant2', uploaded_by_name: '陈雪琪', created_at: daysAgo(2),
  },
  {
    id: 'att-4', lead_id: 'lead-2', file_name: '报价明细-碧桂园.xlsx',
    file_url: '#', file_size: 81920, version: 3,
    uploaded_by: 'user-consultant2', uploaded_by_name: '陈雪琪', created_at: hoursAgo(8),
  },
];

export const mockChangeLogs: ChangeLog[] = [
  { id: 'cl-1', lead_id: 'lead-1', changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(25), change_type: 'create' },
  { id: 'cl-2', lead_id: 'lead-1', field: 'stage_id', old_value: 'stage-assign', new_value: 'stage-follow', changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(22), change_type: 'stage_change' },
  { id: 'cl-3', lead_id: 'lead-1', field: 'stage_id', old_value: 'stage-follow', new_value: 'stage-survey', changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(8), change_type: 'stage_change' },
  { id: 'cl-4', lead_id: 'lead-1', field: 'budget_max', old_value: 250000, new_value: 280000, changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(5), change_type: 'update' },
  { id: 'cl-5', lead_id: 'lead-1', field: 'stage_id', old_value: 'stage-survey', new_value: 'stage-quote', changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(4), change_type: 'stage_change' },
  { id: 'cl-6', lead_id: 'lead-1', field: 'stage_id', old_value: 'stage-quote', new_value: 'stage-contract', changed_by: 'user-consultant1', changed_by_name: '王浩然', changed_at: daysAgo(1), change_type: 'stage_change' },
  { id: 'cl-7', lead_id: 'lead-3', changed_by: 'user-manager1', changed_by_name: '张明远', changed_at: daysAgo(12), change_type: 'create' },
  { id: 'cl-8', lead_id: 'lead-3', field: 'assignee_id', old_value: null, new_value: 'user-consultant3', changed_by: 'user-manager1', changed_by_name: '张明远', changed_at: daysAgo(12), change_type: 'assign' },
  { id: 'cl-11', lead_id: 'lead-11', field: 'stage_id', old_value: 'stage-follow', new_value: 'stage-pool', changed_by: 'user-manager1', changed_by_name: '张明远', changed_at: daysAgo(1), change_type: 'recycle' },
];

export const mockRevisitRecords: RevisitRecord[] = [
  {
    id: 'rev-1', lead_id: 'lead-11', phone: '13800138011', consult_count: 3,
    first_consult_at: daysAgo(30), last_consult_at: daysAgo(3),
    reasons: ['价格对比', '方案不满意', '再考虑考虑'],
    avg_interval_hours: 108, current_owner_id: 'user-consultant1', current_owner_name: '王浩然', total_process_hours: 648,
  },
  {
    id: 'rev-2', lead_id: 'lead-5', phone: '13800138005', consult_count: 2,
    first_consult_at: daysAgo(14), last_consult_at: daysAgo(2),
    reasons: ['对比其他公司', '家人意见不统一'],
    avg_interval_hours: 144, current_owner_id: 'user-consultant4', current_owner_name: '赵梦琪', total_process_hours: 288,
  },
  {
    id: 'rev-3', lead_id: 'lead-10', phone: '13800138010', consult_count: 4,
    first_consult_at: daysAgo(60), last_consult_at: daysAgo(10),
    reasons: ['预算不足', '竞品低价', '方案不满意', '工期太长'],
    avg_interval_hours: 120, current_owner_id: 'user-consultant3', current_owner_name: '刘建国', total_process_hours: 1200,
  },
  {
    id: 'rev-4', lead_id: 'lead-3', phone: '13800138003', consult_count: 2,
    first_consult_at: daysAgo(15), last_consult_at: daysAgo(1),
    reasons: ['婚期临近', '父母意见不同'],
    avg_interval_hours: 168, current_owner_id: 'user-consultant3', current_owner_name: '刘建国', total_process_hours: 336,
  },
];

export const mockDashboardStats: DashboardStats = {
  today_new_leads: 5,
  pending_follow_ups: 18,
  upcoming_surveys: 6,
  predicted_revenue: 1280000,
  revenue_change: 12.5,
  leads_change: 8.3,
  followup_change: -3.2,
  survey_change: 20.0,
};

export const mockTrendData = Array.from({ length: 30 }, (_, i) => {
  const d = daysAgo(29 - i);
  return {
    date: d.slice(5, 10),
    新增线索: Math.floor(Math.random() * 8) + 3,
    已成交: Math.floor(Math.random() * 3) + (i > 20 ? 1 : 0),
    成交金额: (Math.floor(Math.random() * 30) + 10) * 10000,
  };
});

export const mockPerformanceData = [
  { name: '王浩然', leads: 28, won: 6, revenue: 1680000, rate: 21.4 },
  { name: '陈雪琪', leads: 25, won: 5, revenue: 1520000, rate: 20.0 },
  { name: '刘建国', leads: 22, won: 3, revenue: 890000, rate: 13.6 },
  { name: '赵梦琪', leads: 18, won: 4, revenue: 1050000, rate: 22.2 },
];
