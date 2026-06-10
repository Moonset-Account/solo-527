import type {
  Visit,
  Photo,
  Recipient,
  Feedback,
  BudgetCategory,
  Expense,
  Donation,
  ExceptionRecord,
  ExceptionLog,
  Profile,
  SiteSetting,
  AchievementPhoto,
  DashboardStats,
} from '@/lib/types';

const img = (prompt: string, size = 'landscape_16_9') =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;

export const mockProfiles: Profile[] = [
  {
    id: 'profile-1',
    email: 'admin@charity.org',
    full_name: '张管理员',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    email: 'officer@charity.org',
    full_name: '李项目官',
    role: 'officer',
    created_at: '2024-01-15T00:00:00Z',
  },
];

export const mockVisits: Visit[] = [
  {
    id: 'visit-1',
    created_by: 'profile-2',
    visit_date: '2026-05-15',
    location: '云南省丽江市宁蒗县希望小学',
    content: '本次探访共走访了12名受助学生家庭，了解学生的学习和生活情况。同学们本学期的学习成绩普遍有所提升，其中有3名同学进入了班级前10名。学校新的图书馆已经投入使用，孩子们非常开心。',
    status: 'published',
    created_at: '2026-05-15T10:00:00Z',
  },
  {
    id: 'visit-2',
    created_by: 'profile-2',
    visit_date: '2026-04-20',
    location: '四川省凉山州昭觉县民族小学',
    content: '春季探访活动顺利完成，为同学们送去了新的校服和学习用品。学校的多媒体教室已经建成，志愿者老师们开展了为期一周的趣味课程，包括美术、音乐和科学实验。',
    status: 'published',
    created_at: '2026-04-20T14:30:00Z',
  },
  {
    id: 'visit-3',
    created_by: 'profile-2',
    visit_date: '2026-03-10',
    location: '贵州省黔东南州台江县施洞镇中心小学',
    content: '新学期开始，我们对20名新申请资助的学生进行了家庭走访和资格审核。经过严格的评估，最终确定了15名符合条件的受助学生。同时对在读的45名学生进行了回访，了解他们的学习进展。',
    status: 'published',
    created_at: '2026-03-10T09:00:00Z',
  },
  {
    id: 'visit-4',
    created_by: 'profile-2',
    visit_date: '2026-06-01',
    location: '云南省丽江市宁蒗县红旗小学',
    content: '六一儿童节特别活动，我们组织了一场趣味运动会，为孩子们送去了节日礼物。活动得到了当地教育局的大力支持，共有200多名师生参与。',
    status: 'submitted',
    created_at: '2026-06-01T16:00:00Z',
  },
];

export const mockPhotos: Photo[] = [
  {
    id: 'photo-1',
    visit_id: 'visit-1',
    image_url: img('山区希望小学教室，阳光洒在课桌上，学生们在认真学习，温暖明亮', 'landscape_16_9'),
    caption: '新教室的第一节课',
    description: '希望小学的新教室，阳光洒在课桌上',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-05-15T10:30:00Z',
  },
  {
    id: 'photo-2',
    visit_id: 'visit-1',
    image_url: img('小学生在图书馆看书，阳光从窗户照进来，温馨安静的氛围', 'landscape_16_9'),
    caption: '沉浸在书海中',
    description: '同学们在新图书馆阅读',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-05-15T10:35:00Z',
  },
  {
    id: 'photo-3',
    visit_id: 'visit-1',
    image_url: img('志愿者老师给山区孩子上课，孩子们专注听讲的表情，温暖的教室', 'landscape_16_9'),
    caption: '专注的眼神',
    description: '志愿者老师在给孩子们上课',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-05-15T10:40:00Z',
  },
  {
    id: 'photo-4',
    visit_id: 'visit-2',
    image_url: img('山区学生穿上新校服，开心地笑着，背景是青山绿树', 'landscape_16_9'),
    caption: '我们的新校服',
    description: '同学们穿上了崭新的校服',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-04-20T15:00:00Z',
  },
  {
    id: 'photo-5',
    visit_id: 'visit-2',
    image_url: img('志愿者和孩子们一起做科学实验，孩子们好奇兴奋的表情', 'landscape_16_9'),
    caption: '神奇的科学课',
    description: '趣味科学实验课',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-04-20T15:30:00Z',
  },
  {
    id: 'photo-6',
    visit_id: 'visit-3',
    image_url: img('志愿者走访山区家庭，和学生家长亲切交谈，朴实的农家小院', 'landscape_16_9'),
    caption: '家访的温暖',
    description: '走访受助学生家庭',
    review_status: 'approved',
    review_notes: null,
    created_at: '2026-03-10T10:00:00Z',
  },
  {
    id: 'photo-7',
    visit_id: 'visit-4',
    image_url: img('六一儿童节运动会，孩子们在操场上奔跑，彩旗飘扬，欢乐的气氛', 'landscape_16_9'),
    caption: '欢乐的运动会',
    description: '六一趣味运动会',
    review_status: 'pending',
    review_notes: null,
    created_at: '2026-06-01T16:30:00Z',
  },
  {
    id: 'photo-8',
    visit_id: 'visit-4',
    image_url: img('孩子们收到节日礼物，开心地举着礼物，脸上洋溢着笑容', 'landscape_16_9'),
    caption: '惊喜的礼物',
    description: '收到礼物的孩子们',
    review_status: 'pending',
    review_notes: null,
    created_at: '2026-06-01T16:45:00Z',
  },
];

export const mockRecipients: Recipient[] = [
  {
    id: 'recipient-1',
    name: '小雨',
    age: 12,
    school: '宁蒗县希望小学',
    grade: '六年级',
    bio: '家住高寒山区，父亲常年患病，家庭收入微薄。但小雨品学兼优，是班里的学习委员，梦想成为一名医生。',
    avatar_url: img('可爱的山区小女孩头像，面带微笑，清澈的眼神，portrait_4_3', 'portrait_4_3'),
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'recipient-2',
    name: '小明',
    age: 14,
    school: '昭觉县民族中学',
    grade: '初二',
    bio: '留守儿童，与爷爷奶奶一起生活。小明数学成绩特别优秀，多次在数学竞赛中获奖。',
    avatar_url: img('阳光的山区男孩头像，面带微笑，清澈的眼神，portrait_4_3', 'portrait_4_3'),
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'recipient-3',
    name: '小燕',
    age: 11,
    school: '台江县施洞镇中心小学',
    grade: '五年级',
    bio: '喜欢画画和唱歌，是学校文艺队的骨干。虽然家庭困难，但她总是乐观开朗，用笑容感染身边的人。',
    avatar_url: img('可爱的苗族小女孩头像，面带微笑，清澈的眼神，portrait_4_3', 'portrait_4_3'),
    created_at: '2024-09-01T00:00:00Z',
  },
  {
    id: 'recipient-4',
    name: '阿杰',
    age: 13,
    school: '宁蒗县红旗中学',
    grade: '初一',
    bio: '体育特长生，擅长中长跑。在今年的县运动会上获得了男子1500米冠军。',
    avatar_url: img('健康的山区男孩头像，面带微笑，清澈的眼神，portrait_4_3', 'portrait_4_3'),
    created_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 'recipient-5',
    name: '小芳',
    age: 10,
    school: '昭觉县城北小学',
    grade: '四年级',
    bio: '语文课代表，作文写得特别好。她的作文《我的梦想》获得了州级征文比赛一等奖。',
    avatar_url: img('文静的山区小女孩头像，面带微笑，清澈的眼神，portrait_4_3', 'portrait_4_3'),
    created_at: '2025-09-01T00:00:00Z',
  },
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 'feedback-1',
    recipient_id: 'recipient-1',
    type: 'story',
    content: '这学期我参加了学校的数学兴趣小组，在老师的帮助下，我的数学成绩从班级第15名提升到了第3名。我特别开心！感谢资助我的叔叔阿姨，我会继续努力学习，将来也想帮助更多像我一样的小朋友。',
    created_at: '2026-05-20T00:00:00Z',
  },
  {
    id: 'feedback-2',
    recipient_id: 'recipient-2',
    type: 'letter',
    content: '亲爱的资助人叔叔/阿姨：\n\n您好！我是小明。这学期我们学校有了新的多媒体教室，第一次上电脑课的时候，我激动得手都在抖。我终于可以在电脑上查阅学习资料了。\n\n上次您寄来的课外书我已经全部读完了，我最喜欢《十万个为什么》。等我长大了，我也要做一个有知识的人，去帮助更多需要帮助的人。\n\n谢谢您的帮助，祝您身体健康，工作顺利！\n\n此致\n敬礼\n小明\n2026年5月',
    created_at: '2026-05-15T00:00:00Z',
  },
  {
    id: 'feedback-3',
    recipient_id: 'recipient-3',
    type: 'story',
    content: '今年的六一是我最开心的一天！志愿者老师们来学校和我们一起过节，我们做游戏、唱歌、画画。老师说我画的画特别好看，还把我的画贴在了学校的宣传栏里。我长大想当一名画家，用画笔画出美丽的家乡。',
    created_at: '2026-06-02T00:00:00Z',
  },
  {
    id: 'feedback-4',
    recipient_id: 'recipient-4',
    type: 'grade',
    content: '本学期成绩单：\n语文：92分\n数学：95分\n英语：88分\n物理：90分\n体育：100分\n\n本学期获得荣誉：\n- 县运动会男子1500米冠军\n- 校级三好学生\n- 学习进步奖',
    created_at: '2026-06-10T00:00:00Z',
  },
  {
    id: 'feedback-5',
    recipient_id: 'recipient-5',
    type: 'letter',
    content: '亲爱的爱心人士：\n\n您好！我是小芳。告诉您一个好消息，我的作文《我的梦想》在全州的征文比赛中获得了一等奖！当我上台领奖的时候，我心里想的是您。如果没有您的帮助，我可能连买作文选的钱都没有。\n\n我的梦想是成为一名作家，写很多很多好听的故事。我会为了这个梦想努力的！\n\n再次感谢您的帮助！\n\n小芳\n2026年5月',
    created_at: '2026-05-25T00:00:00Z',
  },
];

export const mockBudgetCategories: BudgetCategory[] = [
  {
    id: 'budget-1',
    name: '助学金',
    allocated_amount: 500000,
    description: '用于受助学生的学费、生活费补贴',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'budget-2',
    name: '学习物资',
    allocated_amount: 100000,
    description: '书籍、文具、学习用品采购',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'budget-3',
    name: '探访经费',
    allocated_amount: 50000,
    description: '探访交通、住宿、餐饮费用',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'budget-4',
    name: '活动经费',
    allocated_amount: 80000,
    description: '夏令营、研学等集体活动',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'budget-5',
    name: '其他支出',
    allocated_amount: 20000,
    description: '其他临时必要支出',
    created_at: '2024-01-01T00:00:00Z',
  },
];

export const mockExpenses: Expense[] = [
  { id: 'expense-1', category_id: 'budget-1', donation_id: null, amount: 156000, description: '2026春季学期助学金发放（156人×1000元）', expense_date: '2026-02-20', created_at: '2026-02-20T00:00:00Z' },
  { id: 'expense-2', category_id: 'budget-2', donation_id: null, amount: 32500, description: '新学期学习用品采购（书包、文具等）', expense_date: '2026-02-25', created_at: '2026-02-25T00:00:00Z' },
  { id: 'expense-3', category_id: 'budget-3', donation_id: null, amount: 8600, description: '3月贵州探访费用（交通、住宿）', expense_date: '2026-03-12', created_at: '2026-03-12T00:00:00Z' },
  { id: 'expense-4', category_id: 'budget-4', donation_id: null, amount: 25000, description: '春季研学活动费用', expense_date: '2026-04-01', created_at: '2026-04-01T00:00:00Z' },
  { id: 'expense-5', category_id: 'budget-3', donation_id: null, amount: 9200, description: '4月四川探访费用', expense_date: '2026-04-22', created_at: '2026-04-22T00:00:00Z' },
  { id: 'expense-6', category_id: 'budget-2', donation_id: null, amount: 18000, description: '夏季校服采购（200套）', expense_date: '2026-04-25', created_at: '2026-04-25T00:00:00Z' },
  { id: 'expense-7', category_id: 'budget-3', donation_id: null, amount: 7800, description: '5月云南探访费用', expense_date: '2026-05-16', created_at: '2026-05-16T00:00:00Z' },
  { id: 'expense-8', category_id: 'budget-4', donation_id: null, amount: 35000, description: '六一儿童节活动经费', expense_date: '2026-05-28', created_at: '2026-05-28T00:00:00Z' },
  { id: 'expense-9', category_id: 'budget-5', donation_id: null, amount: 5000, description: '学生体检费用', expense_date: '2026-06-01', created_at: '2026-06-01T00:00:00Z' },
];

export const mockDonations: Donation[] = [
  { id: 'donation-1', donor_name: '匿名爱心人士', amount: 100000, message: '希望孩子们能够健康快乐成长', is_anonymous: true, payment_method: '微信支付', is_recurring: false, created_at: '2026-01-15T00:00:00Z' },
  { id: 'donation-2', donor_name: '王建国', amount: 50000, message: '支持教育，功在千秋', is_anonymous: false, payment_method: '银行转账', is_recurring: false, created_at: '2026-02-01T00:00:00Z' },
  { id: 'donation-3', donor_name: '李女士', amount: 10000, message: '为小雨同学加油！', is_anonymous: false, payment_method: '支付宝', is_recurring: true, created_at: '2026-02-10T00:00:00Z' },
  { id: 'donation-4', donor_name: '上海某科技公司', amount: 200000, message: '企业社会责任，我们在行动', is_anonymous: false, payment_method: '银行转账', is_recurring: false, created_at: '2026-03-05T00:00:00Z' },
  { id: 'donation-5', donor_name: '张先生', amount: 5000, message: '小明同学，继续努力！', is_anonymous: false, payment_method: '微信支付', is_recurring: true, created_at: '2026-03-15T00:00:00Z' },
  { id: 'donation-6', donor_name: '陈阿姨', amount: 2000, message: '给孩子们买些文具', is_anonymous: false, payment_method: '微信支付', is_recurring: false, created_at: '2026-04-01T00:00:00Z' },
  { id: 'donation-7', donor_name: '北京某基金会', amount: 500000, message: '专项用于图书馆建设', is_anonymous: false, payment_method: '银行转账', is_recurring: false, created_at: '2026-04-10T00:00:00Z' },
  { id: 'donation-8', donor_name: '匿名爱心人士', amount: 8000, message: null, is_anonymous: true, payment_method: '支付宝', is_recurring: false, created_at: '2026-04-20T00:00:00Z' },
  { id: 'donation-9', donor_name: '深圳某创业团队', amount: 30000, message: '知识改变命运', is_anonymous: false, payment_method: '银行转账', is_recurring: false, created_at: '2026-05-01T00:00:00Z' },
  { id: 'donation-10', donor_name: '刘先生', amount: 10000, message: '小燕同学，坚持你的绘画梦想！', is_anonymous: false, payment_method: '微信支付', is_recurring: true, created_at: '2026-05-10T00:00:00Z' },
  { id: 'donation-11', donor_name: '匿名爱心人士', amount: 25000, message: '给孩子们的六一份礼物', is_anonymous: true, payment_method: '支付宝', is_recurring: false, created_at: '2026-05-25T00:00:00Z' },
  { id: 'donation-12', donor_name: '周女士', amount: 3000, message: '小芳的作文真棒！', is_anonymous: false, payment_method: '微信支付', is_recurring: false, created_at: '2026-06-01T00:00:00Z' },
];

export const mockExceptions: ExceptionRecord[] = [
  {
    id: 'exception-1',
    type: 'material_discrepancy',
    title: '4月学习物资采购数量差异',
    status: 'closed',
    impact_scope: '涉及昭觉县200名学生的校服发放，实际到货195套，缺少5套。影响5名学生未能及时领取校服。',
    handling_path: '1. 立即联系供应商核实发货数量\n2. 对已发放物资进行清点登记\n3. 协调供应商补发缺失的5套校服\n4. 对受影响的5名学生进行登记，待补发后优先发放',
    review_notes: '供应商承认是仓库盘点错误导致少发，已于5月5日补发到位。已建立物资入库双人清点制度，防止类似问题再次发生。同时修订了采购合同，增加了延期交付的赔偿条款。',
    close_reason: '供应商已补发缺失物资，问题已解决。已优化物资入库流程，建立双人清点和签字确认制度。',
    parent_exception_id: null,
    created_at: '2026-04-26T09:00:00Z',
    updated_at: '2026-05-10T10:00:00Z',
  },
  {
    id: 'exception-2',
    type: 'budget_overrun',
    title: '3月探访经费报销金额差异',
    status: 'closed',
    impact_scope: '贵州探访经费报销中，有一笔1200元的住宿费用票据与实际消费不符，涉及探访经费预算。影响金额1200元。',
    handling_path: '1. 核对报销票据与消费流水\n2. 联系酒店核实消费明细\n3. 要求经办人说明情况\n4. 退回多报金额，完善财务审核流程',
    review_notes: '经查为经办人误将私人消费混入报销，已进行批评教育，多报金额已退回。已加强财务审核，实行双人签字制度。所有支出超过5000元需财务负责人复核。',
    close_reason: '问题已查清，多报款项1200元已全额追回，相关人员已进行批评教育。财务审核流程已优化，增加双人复核环节。',
    parent_exception_id: null,
    created_at: '2026-03-15T10:00:00Z',
    updated_at: '2026-03-25T16:00:00Z',
  },
  {
    id: 'exception-3',
    type: 'material_discrepancy',
    title: '六一活动礼品数量不符',
    status: 'handling',
    impact_scope: '六一儿童节活动准备的200份礼品，实际发放时发现缺少12份，影响12名学生未能当场领取礼品。涉及价值约1800元。',
    handling_path: '1. 立即清点库存确认缺失数量\n2. 紧急采购补充缺失礼品\n3. 对未领到礼品的学生进行登记\n4. 启动二次补发，安排志愿者上门送礼品',
    review_notes: null,
    close_reason: null,
    parent_exception_id: null,
    created_at: '2026-06-02T08:00:00Z',
    updated_at: '2026-06-03T10:00:00Z',
  },
  {
    id: 'exception-4',
    type: 'other',
    title: '受助学生资格复核发现问题',
    status: 'investigating',
    impact_scope: '在春季学期资格复核中，发现1名受助学生的家庭经济状况已明显改善（父母外出务工收入稳定），不再符合资助条件。涉及助学金名额1个。',
    handling_path: '1. 再次核实该学生家庭实际情况（收入证明、走访邻里）\n2. 与学校老师沟通了解学生在校表现\n3. 与学生家长进行面谈，说明政策调整\n4. 研究调整资助资格，将名额转给其他需要帮助的学生\n5. 做好学生心理疏导工作',
    review_notes: null,
    close_reason: null,
    parent_exception_id: null,
    created_at: '2026-06-08T14:00:00Z',
    updated_at: '2026-06-08T14:00:00Z',
  },
];

export const mockExceptionLogs: ExceptionLog[] = [
  { id: 'log-1', exception_id: 'exception-1', action_type: 'status_change', content: '创建异常记录：发现校服缺少5套', created_by: 'profile-2', created_at: '2026-04-26T09:00:00Z' },
  { id: 'log-2', exception_id: 'exception-1', action_type: 'status_change', content: '分配处理：请李项目官核实情况并联系供应商', created_by: 'profile-1', created_at: '2026-04-26T09:30:00Z' },
  { id: 'log-3', exception_id: 'exception-1', action_type: 'handling', content: '联系供应商：供应商承认少发，承诺5月5日前补发', created_by: 'profile-2', created_at: '2026-04-27T10:00:00Z' },
  { id: 'log-4', exception_id: 'exception-1', action_type: 'handling', content: '物资补发到位：5套校服已收到并发放给学生', created_by: 'profile-2', created_at: '2026-05-05T15:00:00Z' },
  { id: 'log-5', exception_id: 'exception-1', action_type: 'note', content: '复盘总结：已建立物资入库双人清点制度，增加采购合同赔偿条款', created_by: 'profile-1', created_at: '2026-05-08T14:00:00Z' },
  { id: 'log-6', exception_id: 'exception-3', action_type: 'status_change', content: '创建异常记录：六一礼品缺少12份', created_by: 'profile-2', created_at: '2026-06-02T08:00:00Z' },
  { id: 'log-7', exception_id: 'exception-3', action_type: 'status_change', content: '分配处理：请尽快采购补充，确保每个孩子都能拿到礼物', created_by: 'profile-1', created_at: '2026-06-02T08:30:00Z' },
];

export const mockSiteSettings: SiteSetting[] = [
  { id: 'setting-1', key: 'project_name', value: '阳光助学计划', updated_by: 'profile-1', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'setting-2', key: 'project_slogan', value: '每一份爱心，点亮一个未来', updated_by: 'profile-1', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'setting-3', key: 'total_raised', value: 1250000, updated_by: 'profile-1', updated_at: '2026-06-01T00:00:00Z' },
  { id: 'setting-4', key: 'beneficiary_count', value: 156, updated_by: 'profile-1', updated_at: '2026-06-01T00:00:00Z' },
  { id: 'setting-5', key: 'service_hours', value: 3280, updated_by: 'profile-1', updated_at: '2026-06-01T00:00:00Z' },
  { id: 'setting-6', key: 'project_budget', value: 750000, updated_by: 'profile-1', updated_at: '2026-01-01T00:00:00Z' },
  { id: 'setting-7', key: 'project_start_date', value: '2024-01-01', updated_by: 'profile-1', updated_at: '2024-01-01T00:00:00Z' },
];

export const mockAchievementPhotos: AchievementPhoto[] = [
  { id: 'ach-1', image_url: img('山区孩子在明亮的教室里上课，阳光洒进来，温馨的教育场景，公益摄影', 'landscape_16_9'), title: '明亮的教室', description: '我们为山区学校援建的新教室', sort_order: 1, is_active: true, created_at: '2026-01-15T00:00:00Z' },
  { id: 'ach-2', image_url: img('孩子们在新图书馆看书，阳光从窗户照进来，安静温馨，公益摄影', 'landscape_16_9'), title: '知识的海洋', description: '新图书馆已投入使用，藏书超过5000册', sort_order: 2, is_active: true, created_at: '2026-02-20T00:00:00Z' },
  { id: 'ach-3', image_url: img('志愿者和孩子们一起做课外活动，蓝天白云下的操场，快乐温馨', 'landscape_16_9'), title: '快乐时光', description: '志愿者老师和孩子们在一起做游戏', sort_order: 3, is_active: true, created_at: '2026-03-10T00:00:00Z' },
  { id: 'ach-4', image_url: img('山区孩子拿着奖状开心地笑，背景是学校，温暖阳光', 'landscape_16_9'), title: '收获的喜悦', description: '又一批同学取得了学习进步', sort_order: 4, is_active: true, created_at: '2026-04-25T00:00:00Z' },
  { id: 'ach-5', image_url: img('孩子们穿上新校服整齐列队，升国旗仪式，庄重而温暖', 'landscape_16_9'), title: '崭新的开始', description: '新校服，新气象，新希望', sort_order: 5, is_active: true, created_at: '2026-05-01T00:00:00Z' },
];

export function getDashboardStats(): DashboardStats {
  const totalRaised = mockDonations.reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = mockExpenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingPhotos = mockPhotos.filter(p => p.review_status === 'pending').length;
  const openExceptions = mockExceptions.filter(e => e.status !== 'closed').length;

  return {
    totalRaised,
    totalExpenses,
    beneficiaryCount: mockRecipients.length,
    serviceHours: 3280,
    visitCount: mockVisits.filter(v => v.status === 'published').length,
    donationCount: mockDonations.length,
    pendingPhotos,
    openExceptions,
  };
}

export function getPublishedVisitsWithPhotos(): Visit[] {
  return mockVisits
    .filter(v => v.status === 'published')
    .map(v => ({
      ...v,
      photos: mockPhotos.filter(p => p.visit_id === v.id && p.review_status === 'approved'),
    }))
    .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
}

export function getFeedbacksWithRecipients(): Feedback[] {
  return mockFeedbacks
    .map(f => ({
      ...f,
      recipient: mockRecipients.find(r => r.id === f.recipient_id),
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function getBudgetWithExpenses(): BudgetCategory[] {
  return mockBudgetCategories.map(c => ({
    ...c,
    expenses: mockExpenses.filter(e => e.category_id === c.id),
  }));
}

export function getExceptionWithLogs(exceptionId: string): ExceptionRecord | undefined {
  const exception = mockExceptions.find(e => e.id === exceptionId);
  if (!exception) return undefined;
  return {
    ...exception,
    logs: mockExceptionLogs
      .filter(l => l.exception_id === exceptionId)
      .map(l => ({
        ...l,
        handler: mockProfiles.find(p => p.id === l.created_by),
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
  };
}
