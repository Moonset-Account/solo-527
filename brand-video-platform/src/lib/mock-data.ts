import { Topic, Script, Task, Schedule, ExceptionRecord, TimelineEvent, Profile, MaterialTag, SensitiveWord } from './types'

export const mockProfiles: Profile[] = [
  { id: 'u1', display_name: '张明远', role: 'admin', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u2', display_name: '李思涵', role: 'director', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u3', display_name: '王子墨', role: 'director', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u4', display_name: '赵光远', role: 'cameraman', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u5', display_name: '陈影彤', role: 'cameraman', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u6', display_name: '刘剪辑', role: 'editor', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u7', display_name: '周剪影', role: 'editor', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u8', display_name: '孙运营', role: 'operator', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
  { id: 'u9', display_name: '吴推广', role: 'operator', avatar_url: null, created_at: '2025-01-10T08:00:00Z' },
]

export const mockTopics: Topic[] = [
  {
    id: 't1', title: '夏日清凉饮品系列', description: '针对夏季饮品市场推出的品牌短视频系列，覆盖3款核心产品', brand_line: '茶研悦色',
    target_platform: ['抖音', '小红书'], expected_publish_date: '2025-07-15', tags: ['夏季', '饮品', '新品'],
    status: 'published', creator_id: 'u2', creator_name: '李思涵', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-28T16:00:00Z'
  },
  {
    id: 't2', title: '品牌周年庆幕后花絮', description: '拍摄品牌五周年庆典的幕后故事，展现团队凝聚力', brand_line: '茶研悦色',
    target_platform: ['抖音', '视频号'], expected_publish_date: '2025-07-20', tags: ['周年庆', '幕后', '品牌'],
    status: 'in_editing', creator_id: 'u3', creator_name: '王子墨', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-06-05T14:00:00Z', updated_at: '2025-06-25T09:00:00Z'
  },
  {
    id: 't3', title: '新品抹茶拿铁测评', description: '新品抹茶拿铁的真实测评短视频，邀请KOL参与', brand_line: '茶研悦色',
    target_platform: ['小红书', 'B站'], expected_publish_date: '2025-07-25', tags: ['新品', '抹茶', '测评'],
    status: 'in_filming', creator_id: 'u2', creator_name: '李思涵', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-06-08T11:00:00Z', updated_at: '2025-06-22T15:00:00Z'
  },
  {
    id: 't4', title: '咖啡拉花教程系列', description: '专业咖啡师演示拉花技巧，提升品牌专业形象', brand_line: '醇香咖啡',
    target_platform: ['抖音', '小红书'], expected_publish_date: '2025-08-01', tags: ['咖啡', '教程', '拉花'],
    status: 'in_script', creator_id: 'u3', creator_name: '王子墨', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-06-10T09:00:00Z', updated_at: '2025-06-20T10:00:00Z'
  },
  {
    id: 't5', title: '有机茶园溯源纪录片', description: '走进有机茶园，记录从采摘到加工的全过程', brand_line: '茶研悦色',
    target_platform: ['视频号', 'B站'], expected_publish_date: '2025-08-10', tags: ['溯源', '有机', '纪录片'],
    status: 'approved', creator_id: 'u2', creator_name: '李思涵', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-06-12T13:00:00Z', updated_at: '2025-06-18T11:00:00Z'
  },
  {
    id: 't6', title: '办公室下午茶场景种草', description: '在办公室场景中植入品牌下午茶产品，自然种草', brand_line: '茶研悦色',
    target_platform: ['小红书'], expected_publish_date: '2025-08-05', tags: ['办公室', '下午茶', '种草'],
    status: 'pending_review', creator_id: 'u3', creator_name: '王子墨', reviewer_id: null, reviewer_name: null,
    created_at: '2025-06-15T16:00:00Z', updated_at: '2025-06-15T16:00:00Z'
  },
  {
    id: 't7', title: '联名款限定包装开箱', description: '与知名IP联名的限定包装开箱视频，制造稀缺感', brand_line: '醇香咖啡',
    target_platform: ['抖音', '小红书', 'B站'], expected_publish_date: '2025-08-15', tags: ['联名', '开箱', '限定'],
    status: 'draft', creator_id: 'u2', creator_name: '李思涵', reviewer_id: null, reviewer_name: null,
    created_at: '2025-06-18T10:00:00Z', updated_at: '2025-06-18T10:00:00Z'
  },
  {
    id: 't8', title: '冷萃咖啡制作Vlog', description: '记录冷萃咖啡从选豆到萃取的全过程Vlog', brand_line: '醇香咖啡',
    target_platform: ['抖音', '视频号'], expected_publish_date: '2025-07-30', tags: ['冷萃', 'Vlog', '制作'],
    status: 'scheduled', creator_id: 'u3', creator_name: '王子墨', reviewer_id: 'u1', reviewer_name: '张明远',
    created_at: '2025-05-28T08:00:00Z', updated_at: '2025-06-26T14:00:00Z'
  },
]

export const mockScripts: Script[] = [
  {
    id: 's1', topic_id: 't1', content: '开场：夏日高温镜头切入\n产品展示：3款新品依次亮相\n场景切换：户外→办公室→家中\n结尾：限时优惠信息+品牌Slogan',
    version: 2, status: 'approved', author_id: 'u2', author_name: '李思涵',
    created_at: '2025-06-02T10:00:00Z', updated_at: '2025-06-04T14:00:00Z'
  },
  {
    id: 's2', topic_id: 't2', content: '开场：倒计时五周年\n幕后花絮：筹备过程中的趣事\n高潮：庆典现场精彩瞬间\n结尾：感谢一路同行',
    version: 1, status: 'approved', author_id: 'u3', author_name: '王子墨',
    created_at: '2025-06-06T11:00:00Z', updated_at: '2025-06-06T11:00:00Z'
  },
  {
    id: 's3', topic_id: 't3', content: 'KOL介绍→产品开箱→真实品尝反应→评分→推荐理由→结尾引导',
    version: 1, status: 'submitted', author_id: 'u2', author_name: '李思涵',
    created_at: '2025-06-09T15:00:00Z', updated_at: '2025-06-09T15:00:00Z'
  },
  {
    id: 's4', topic_id: 't4', content: '工具介绍→基础拉花演示→进阶技巧→常见错误→作品展示→互动引导',
    version: 1, status: 'draft', author_id: 'u3', author_name: '王子墨',
    created_at: '2025-06-11T09:00:00Z', updated_at: '2025-06-11T09:00:00Z'
  },
  {
    id: 's5', topic_id: 't5', content: '出发→茶园航拍→采摘过程→加工车间→品鉴环节→品牌理念',
    version: 1, status: 'approved', author_id: 'u2', author_name: '李思涵',
    created_at: '2025-06-13T10:00:00Z', updated_at: '2025-06-13T10:00:00Z'
  },
]

export const mockTasks: Task[] = [
  {
    id: 'tk1', topic_id: 't1', topic_title: '夏日清凉饮品系列', type: 'filming',
    assignee_id: 'u4', assignee_name: '赵光远', status: 'completed', deadline: '2025-06-15',
    description: '拍摄3款夏日新品的室外+室内场景', created_at: '2025-06-05T10:00:00Z', updated_at: '2025-06-14T18:00:00Z'
  },
  {
    id: 'tk2', topic_id: 't1', topic_title: '夏日清凉饮品系列', type: 'editing',
    assignee_id: 'u6', assignee_name: '刘剪辑', status: 'completed', deadline: '2025-06-20',
    description: '剪辑15s抖音版+30s小红书版', created_at: '2025-06-15T10:00:00Z', updated_at: '2025-06-19T16:00:00Z'
  },
  {
    id: 'tk3', topic_id: 't2', topic_title: '品牌周年庆幕后花絮', type: 'filming',
    assignee_id: 'u5', assignee_name: '陈影彤', status: 'completed', deadline: '2025-06-22',
    description: '拍摄周年庆筹备和现场幕后', created_at: '2025-06-08T10:00:00Z', updated_at: '2025-06-21T18:00:00Z'
  },
  {
    id: 'tk4', topic_id: 't2', topic_title: '品牌周年庆幕后花絮', type: 'editing',
    assignee_id: 'u7', assignee_name: '周剪影', status: 'in_progress', deadline: '2025-06-28',
    description: '剪辑60s抖音版+3min B站版', created_at: '2025-06-22T10:00:00Z', updated_at: '2025-06-24T14:00:00Z'
  },
  {
    id: 'tk5', topic_id: 't3', topic_title: '新品抹茶拿铁测评', type: 'filming',
    assignee_id: 'u4', assignee_name: '赵光远', status: 'in_progress', deadline: '2025-06-30',
    description: 'KOL测评拍摄，含室内和户外场景', created_at: '2025-06-10T10:00:00Z', updated_at: '2025-06-23T14:00:00Z'
  },
  {
    id: 'tk6', topic_id: 't3', topic_title: '新品抹茶拿铁测评', type: 'editing',
    assignee_id: null, assignee_name: null, status: 'pending', deadline: null,
    description: '待拍摄完成后分配剪辑任务', created_at: '2025-06-10T10:00:00Z', updated_at: '2025-06-10T10:00:00Z'
  },
  {
    id: 'tk7', topic_id: 't5', topic_title: '有机茶园溯源纪录片', type: 'filming',
    assignee_id: 'u5', assignee_name: '陈影彤', status: 'assigned', deadline: '2025-07-05',
    description: '茶园实地拍摄，航拍+地面', created_at: '2025-06-19T10:00:00Z', updated_at: '2025-06-19T10:00:00Z'
  },
  {
    id: 'tk8', topic_id: 't8', topic_title: '冷萃咖啡制作Vlog', type: 'filming',
    assignee_id: 'u4', assignee_name: '赵光远', status: 'completed', deadline: '2025-06-18',
    description: '咖啡制作全过程Vlog拍摄', created_at: '2025-06-01T10:00:00Z', updated_at: '2025-06-17T18:00:00Z'
  },
  {
    id: 'tk9', topic_id: 't8', topic_title: '冷萃咖啡制作Vlog', type: 'editing',
    assignee_id: 'u6', assignee_name: '刘剪辑', status: 'completed', deadline: '2025-06-23',
    description: 'Vlog剪辑，保留自然真实感', created_at: '2025-06-18T10:00:00Z', updated_at: '2025-06-22T16:00:00Z'
  },
]

export const mockSchedules: Schedule[] = [
  {
    id: 'sc1', topic_id: 't1', topic_title: '夏日清凉饮品系列', platform: '抖音',
    publish_date: '2025-07-15', publish_time: '12:00', status: 'published',
    operator_id: 'u8', operator_name: '孙运营', created_at: '2025-06-20T10:00:00Z', updated_at: '2025-06-28T12:00:00Z'
  },
  {
    id: 'sc2', topic_id: 't1', topic_title: '夏日清凉饮品系列', platform: '小红书',
    publish_date: '2025-07-15', publish_time: '18:00', status: 'published',
    operator_id: 'u8', operator_name: '孙运营', created_at: '2025-06-20T10:00:00Z', updated_at: '2025-06-28T18:00:00Z'
  },
  {
    id: 'sc3', topic_id: 't2', topic_title: '品牌周年庆幕后花絮', platform: '抖音',
    publish_date: '2025-07-20', publish_time: '10:00', status: 'scheduled',
    operator_id: 'u9', operator_name: '吴推广', created_at: '2025-06-25T10:00:00Z', updated_at: '2025-06-25T10:00:00Z'
  },
  {
    id: 'sc4', topic_id: 't2', topic_title: '品牌周年庆幕后花絮', platform: '视频号',
    publish_date: '2025-07-20', publish_time: '20:00', status: 'scheduled',
    operator_id: 'u9', operator_name: '吴推广', created_at: '2025-06-25T10:00:00Z', updated_at: '2025-06-25T10:00:00Z'
  },
  {
    id: 'sc5', topic_id: 't8', topic_title: '冷萃咖啡制作Vlog', platform: '抖音',
    publish_date: '2025-07-30', publish_time: '11:00', status: 'scheduled',
    operator_id: 'u8', operator_name: '孙运营', created_at: '2025-06-26T10:00:00Z', updated_at: '2025-06-26T10:00:00Z'
  },
  {
    id: 'sc6', topic_id: 't8', topic_title: '冷萃咖啡制作Vlog', platform: '视频号',
    publish_date: '2025-07-30', publish_time: '19:00', status: 'scheduled',
    operator_id: 'u8', operator_name: '孙运营', created_at: '2025-06-26T10:00:00Z', updated_at: '2025-06-26T10:00:00Z'
  },
]

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'e1', topic_id: 't3', topic_title: '新品抹茶拿铁测评', script_id: 's3',
    type: 'sensitive_word', sensitive_word: '最好', content_snippet: '这款抹茶拿铁是市面上最好的选择',
    status: 'pending', handler_id: null, handler_name: null, conclusion: null,
    created_at: '2025-06-09T16:00:00Z', resolved_at: null
  },
  {
    id: 'e2', topic_id: 't7', topic_title: '联名款限定包装开箱', script_id: null,
    type: 'sensitive_word', sensitive_word: '第一', content_snippet: '国内第一个推出联名款的咖啡品牌',
    status: 'pending', handler_id: null, handler_name: null, conclusion: null,
    created_at: '2025-06-18T11:00:00Z', resolved_at: null
  },
  {
    id: 'e3', topic_id: 't1', topic_title: '夏日清凉饮品系列', script_id: 's1',
    type: 'sensitive_word', sensitive_word: '国家级', content_snippet: '国家级茶叶品质认证',
    status: 'resolved', handler_id: 'u1', handler_name: '张明远',
    conclusion: '已确认产品确实获得国家级认证，文案可保留但建议补充证书画面佐证',
    created_at: '2025-06-03T10:00:00Z', resolved_at: '2025-06-04T09:00:00Z'
  },
  {
    id: 'e4', topic_id: 't5', topic_title: '有机茶园溯源纪录片', script_id: 's5',
    type: 'sensitive_word', sensitive_word: '纯天然', content_snippet: '纯天然无添加的有机茶叶',
    status: 'processing', handler_id: 'u1', handler_name: '张明远', conclusion: null,
    created_at: '2025-06-13T11:00:00Z', resolved_at: null
  },
  {
    id: 'e5', topic_id: 't4', topic_title: '咖啡拉花教程系列', script_id: 's4',
    type: 'sensitive_word', sensitive_word: '最好', content_snippet: '拉花入门最好的教程视频',
    status: 'pending', handler_id: null, handler_name: null, conclusion: null,
    created_at: '2025-06-11T10:00:00Z', resolved_at: null
  },
]

export const mockTimelineEvents: TimelineEvent[] = [
  { id: 'tl1', topic_id: 't1', event_type: 'topic_created', actor_id: 'u2', actor_name: '李思涵', description: '创建选题：夏日清凉饮品系列', metadata: {}, created_at: '2025-06-01T10:00:00Z' },
  { id: 'tl2', topic_id: 't1', event_type: 'topic_approved', actor_id: 'u1', actor_name: '张明远', description: '审批通过选题', metadata: {}, created_at: '2025-06-02T09:00:00Z' },
  { id: 'tl3', topic_id: 't1', event_type: 'script_submitted', actor_id: 'u2', actor_name: '李思涵', description: '提交脚本 v1', metadata: { version: 1 }, created_at: '2025-06-02T10:00:00Z' },
  { id: 'tl4', topic_id: 't1', event_type: 'exception_created', actor_id: 'system', actor_name: '系统', description: '敏感词"国家级"命中', metadata: { word: '国家级' }, created_at: '2025-06-03T10:00:00Z' },
  { id: 'tl5', topic_id: 't1', event_type: 'exception_resolved', actor_id: 'u1', actor_name: '张明远', description: '处理敏感词异常，结论：已确认认证，可保留', metadata: {}, created_at: '2025-06-04T09:00:00Z' },
  { id: 'tl6', topic_id: 't1', event_type: 'script_approved', actor_id: 'u1', actor_name: '张明远', description: '审批通过脚本 v2', metadata: { version: 2 }, created_at: '2025-06-04T14:00:00Z' },
  { id: 'tl7', topic_id: 't1', event_type: 'task_assigned', actor_id: 'u1', actor_name: '张明远', description: '分派拍摄任务给赵光远', metadata: { task_type: 'filming' }, created_at: '2025-06-05T10:00:00Z' },
  { id: 'tl8', topic_id: 't1', event_type: 'task_completed', actor_id: 'u4', actor_name: '赵光远', description: '完成拍摄', metadata: { task_type: 'filming' }, created_at: '2025-06-14T18:00:00Z' },
  { id: 'tl9', topic_id: 't1', event_type: 'task_assigned', actor_id: 'u1', actor_name: '张明远', description: '分派剪辑任务给刘剪辑', metadata: { task_type: 'editing' }, created_at: '2025-06-15T10:00:00Z' },
  { id: 'tl10', topic_id: 't1', event_type: 'task_completed', actor_id: 'u6', actor_name: '刘剪辑', description: '完成剪辑', metadata: { task_type: 'editing' }, created_at: '2025-06-19T16:00:00Z' },
  { id: 'tl11', topic_id: 't1', event_type: 'schedule_created', actor_id: 'u8', actor_name: '孙运营', description: '创建排期：抖音 7月15日 12:00', metadata: { platform: '抖音' }, created_at: '2025-06-20T10:00:00Z' },
  { id: 'tl12', topic_id: 't1', event_type: 'published', actor_id: 'u8', actor_name: '孙运营', description: '已在抖音发布', metadata: { platform: '抖音' }, created_at: '2025-06-28T12:00:00Z' },
]

export const mockMaterialTags: MaterialTag[] = [
  { id: 'mt1', topic_id: 't1', tag_name: '夏季', category: '季节', created_at: '2025-06-01T10:00:00Z' },
  { id: 'mt2', topic_id: 't1', tag_name: '饮品', category: '品类', created_at: '2025-06-01T10:00:00Z' },
  { id: 'mt3', topic_id: 't1', tag_name: '新品', category: '类型', created_at: '2025-06-01T10:00:00Z' },
  { id: 'mt4', topic_id: 't2', tag_name: '周年庆', category: '活动', created_at: '2025-06-05T10:00:00Z' },
  { id: 'mt5', topic_id: 't2', tag_name: '幕后', category: '类型', created_at: '2025-06-05T10:00:00Z' },
  { id: 'mt6', topic_id: 't3', tag_name: '抹茶', category: '品类', created_at: '2025-06-08T10:00:00Z' },
  { id: 'mt7', topic_id: 't3', tag_name: '测评', category: '类型', created_at: '2025-06-08T10:00:00Z' },
  { id: 'mt8', topic_id: 't4', tag_name: '咖啡', category: '品类', created_at: '2025-06-10T10:00:00Z' },
  { id: 'mt9', topic_id: 't4', tag_name: '教程', category: '类型', created_at: '2025-06-10T10:00:00Z' },
  { id: 'mt10', topic_id: 't5', tag_name: '溯源', category: '类型', created_at: '2025-06-12T10:00:00Z' },
  { id: 'mt11', topic_id: 't5', tag_name: '纪录片', category: '类型', created_at: '2025-06-12T10:00:00Z' },
  { id: 'mt12', topic_id: 't6', tag_name: '办公室', category: '场景', created_at: '2025-06-15T10:00:00Z' },
  { id: 'mt13', topic_id: 't7', tag_name: '联名', category: '类型', created_at: '2025-06-18T10:00:00Z' },
  { id: 'mt14', topic_id: 't8', tag_name: 'Vlog', category: '类型', created_at: '2025-05-28T10:00:00Z' },
  { id: 'mt15', topic_id: 't8', tag_name: '冷萃', category: '工艺', created_at: '2025-05-28T10:00:00Z' },
]

export const mockSensitiveWords: SensitiveWord[] = [
  { id: 'sw1', word: '最好', category: '极限用语', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw2', word: '第一', category: '极限用语', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw3', word: '国家级', category: '权威用语', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw4', word: '纯天然', category: '虚假宣传', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw5', word: '独家', category: '极限用语', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw6', word: '全网最低', category: '价格违规', is_active: true, created_at: '2025-01-01T00:00:00Z' },
  { id: 'sw7', word: '秒杀', category: '价格违规', is_active: false, created_at: '2025-01-01T00:00:00Z' },
]
