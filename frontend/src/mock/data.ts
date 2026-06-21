import type {
  User,
  KnowledgeBase,
  TemplateStatus,
  PromptVersion,
  EmailDraft,
  ReviewRecord,
  RiskSample,
  AnalyticsData,
  OperationLog,
  PaginationResponse,
  ApiResponse
} from '@/types'

export const mockUsers: User[] = [
  {
    id: 'user_001',
    username: 'admin',
    password: 'admin123',
    name: '系统管理员',
    email: 'admin@company.com',
    role: 'admin',
    avatar: '',
    department: '信息技术部',
    createdAt: '2025-01-01T00:00:00.000Z',
    lastLoginAt: '2026-06-20T09:30:00.000Z'
  },
  {
    id: 'user_002',
    username: 'reviewer',
    password: 'review123',
    name: '张复核',
    email: 'zhang.fuhe@company.com',
    role: 'reviewer',
    avatar: '',
    department: '风险管理部',
    createdAt: '2025-01-15T00:00:00.000Z',
    lastLoginAt: '2026-06-20T08:45:00.000Z'
  },
  {
    id: 'user_003',
    username: 'operator',
    password: 'operate123',
    name: '李运营',
    email: 'li.yunying@company.com',
    role: 'operator',
    avatar: '',
    department: '客户服务部',
    createdAt: '2025-02-01T00:00:00.000Z',
    lastLoginAt: '2026-06-20T10:15:00.000Z'
  }
]

export const mockKnowledge: KnowledgeBase[] = [
  {
    id: 'kb_001',
    title: '客户信息保护政策',
    category: 'policy',
    content: '本政策适用于所有与客户信息相关的业务活动。所有员工必须严格遵守客户信息保密规定，不得泄露、出售或非法使用客户个人信息。客户信息包括但不限于：姓名、身份证号、联系方式、账户信息、交易记录等。',
    tags: ['隐私', '合规', '客户信息'],
    version: '2.1.0',
    status: 'active',
    createdBy: 'user_001',
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2026-04-15T14:30:00.000Z',
    references: ['《个人信息保护法》', '公司数据安全管理制度']
  },
  {
    id: 'kb_002',
    title: '理财产品风险等级说明',
    category: 'product',
    content: 'R1（谨慎型）：本金损失风险极低；R2（稳健型）：本金损失风险较低；R3（平衡型）：存在一定本金损失风险；R4（进取型）：本金损失风险较高；R5（激进型）：本金损失风险高。向客户推荐产品时必须进行风险承受能力评估。',
    tags: ['理财', '风险等级', '产品'],
    version: '3.0.0',
    status: 'active',
    createdBy: 'user_001',
    createdAt: '2025-03-10T09:00:00.000Z',
    updatedAt: '2026-05-01T11:00:00.000Z'
  },
  {
    id: 'kb_003',
    title: '营销邮件合规审核标准',
    category: 'compliance',
    content: '营销邮件审核标准：1. 不得使用绝对化用语（最、第一、唯一等）；2. 必须包含风险提示；3. 收益率必须明确标注为预期收益；4. 不得承诺保本保收益；5. 必须包含退订链接；6. 发送时间应在合理时段。',
    tags: ['合规', '营销', '审核标准'],
    version: '1.5.0',
    status: 'active',
    createdBy: 'user_002',
    createdAt: '2025-04-01T14:00:00.000Z',
    updatedAt: '2026-03-20T16:45:00.000Z'
  },
  {
    id: 'kb_004',
    title: '客户投诉处理流程',
    category: 'procedure',
    content: '1. 接收投诉并记录详细信息；2. 1个工作日内确认收悉；3. 3个工作日内完成调查；4. 5个工作日内给予答复；5. 复杂投诉可延长至15个工作日；6. 处理完毕后归档并回访。',
    tags: ['投诉', '流程', '客服'],
    version: '2.0.0',
    status: 'active',
    createdBy: 'user_003',
    createdAt: '2025-04-15T10:30:00.000Z',
    updatedAt: '2026-02-10T09:20:00.000Z'
  },
  {
    id: 'kb_005',
    title: '常见开户问题解答',
    category: 'faq',
    content: 'Q：开户需要哪些材料？A：个人身份证、银行卡、本人手机号。Q：开户需要多长时间？A：线上开户约5-10分钟，审核通过后1个工作日内生效。Q：可以代办开户吗？A：除特殊情况外，开户必须本人办理。',
    tags: ['开户', 'FAQ', '常见问题'],
    version: '4.2.0',
    status: 'active',
    createdBy: 'user_003',
    createdAt: '2025-05-01T08:00:00.000Z',
    updatedAt: '2026-06-01T10:00:00.000Z'
  },
  {
    id: 'kb_006',
    title: '反洗钱客户身份识别规定',
    category: 'compliance',
    content: '根据《反洗钱法》要求，在以下情形必须进行客户身份识别：1. 开立账户；2. 单笔交易金额人民币5万元以上；3. 外币等值1万美元以上现金交易；4. 客户身份存疑时；5. 怀疑涉及洗钱或恐怖融资活动时。',
    tags: ['反洗钱', '合规', '身份识别'],
    version: '1.2.0',
    status: 'active',
    createdBy: 'user_002',
    createdAt: '2025-05-15T15:00:00.000Z',
    updatedAt: '2026-01-15T14:00:00.000Z'
  },
  {
    id: 'kb_007',
    title: '基金产品分类介绍',
    category: 'product',
    content: '货币型基金：主要投资于短期货币工具，流动性好、风险低；债券型基金：80%以上资产投资于债券；股票型基金：80%以上资产投资于股票；混合型基金：同时投资于股票、债券和货币市场工具。',
    tags: ['基金', '产品', '分类'],
    version: '1.8.0',
    status: 'active',
    createdBy: 'user_001',
    createdAt: '2025-06-01T11:30:00.000Z',
    updatedAt: '2026-05-15T15:30:00.000Z'
  },
  {
    id: 'kb_008',
    title: '邮件发送时间规范（草稿）',
    category: 'procedure',
    content: '草拟中：营销类邮件建议在工作日上午9:30-11:00或下午14:30-16:30发送，避开节假日和周一上午。重要通知类邮件建议在工作日上午10点前发送。',
    tags: ['邮件', '发送规范'],
    version: '0.9.0',
    status: 'draft',
    createdBy: 'user_003',
    createdAt: '2026-06-10T16:00:00.000Z',
    updatedAt: '2026-06-15T17:00:00.000Z'
  },
  {
    id: 'kb_009',
    title: '旧版客户分级标准（已归档）',
    category: 'policy',
    content: '【本文件已归档，仅作历史参考】2023年以前客户分级标准：按资产规模分为普通客户（50万以下）、金卡客户（50-200万）、钻石客户（200万以上）。',
    tags: ['客户分级', '归档'],
    version: '1.0.0',
    status: 'archived',
    createdBy: 'user_001',
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2024-12-31T23:59:59.000Z'
  },
  {
    id: 'kb_010',
    title: 'APP功能更新说明2026Q2',
    category: 'product',
    content: '2026年第二季度APP更新内容：1. 新增智能理财助手功能；2. 优化资产展示页面；3. 增加指纹登录支持；4. 修复已知问题提升稳定性。',
    tags: ['APP', '更新', '产品功能'],
    version: '1.0.0',
    status: 'active',
    createdBy: 'user_001',
    createdAt: '2026-06-01T09:00:00.000Z',
    updatedAt: '2026-06-10T11:00:00.000Z'
  }
]

export const mockTemplates: TemplateStatus[] = [
  {
    id: 'tpl_001',
    name: '客户生日祝福邮件',
    description: '用于客户生日当天发送的祝福邮件，附带专属礼遇。',
    content: '尊敬的{{客户姓名}}：\n\n在这个特别的日子里，我们全体员工祝您生日快乐！感谢您一直以来对我们的信任与支持。\n\n为您送上一份生日专属礼遇：{{优惠券详情}}。\n\n如有任何需要，请随时联系您的专属客户经理。\n\n祝您生活愉快！\n\n{{公司名称}}客户服务团队',
    variables: ['客户姓名', '优惠券详情', '公司名称'],
    version: '2.3.0',
    category: 'greeting',
    status: 'active',
    isDefault: true,
    createdBy: 'user_001',
    createdAt: '2025-06-15T10:00:00.000Z',
    updatedAt: '2026-04-01T15:00:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2025-06-16T09:00:00.000Z'
  },
  {
    id: 'tpl_002',
    name: '理财产品推荐邮件',
    description: '向客户推荐匹配风险等级的理财产品时使用。',
    content: '尊敬的{{客户姓名}}：\n\n根据您的风险偏好和资产配置需求，我们为您精选了以下产品：\n\n【产品名称】：{{产品名称}}\n【预期收益】：{{预期收益率}}\n【风险等级】：{{风险等级}}\n【投资期限】：{{投资期限}}\n\n{{风险提示}}\n\n如需进一步了解，请联系专属客户经理或前往就近网点咨询。\n\n{{公司名称}}理财团队',
    variables: ['客户姓名', '产品名称', '预期收益率', '风险等级', '投资期限', '风险提示', '公司名称'],
    version: '3.1.0',
    category: 'marketing',
    status: 'active',
    isDefault: true,
    createdBy: 'user_002',
    createdAt: '2025-07-01T14:00:00.000Z',
    updatedAt: '2026-05-10T10:30:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2025-07-03T09:00:00.000Z'
  },
  {
    id: 'tpl_003',
    name: '账户异动通知',
    description: '客户账户发生异常交易或操作时的通知邮件。',
    content: '尊敬的{{客户姓名}}：\n\n您好！系统监测到您的账户发生以下操作：\n\n【操作类型】：{{操作类型}}\n【操作时间】：{{操作时间}}\n【操作金额】：{{操作金额}}\n【关联账户】：{{关联账户}}\n\n如果这是您本人操作，请忽略本邮件。如果不是您本人操作，请立即拨打客服热线{{客服电话}}或登录APP紧急冻结账户。\n\n{{公司名称}}安全中心',
    variables: ['客户姓名', '操作类型', '操作时间', '操作金额', '关联账户', '客服电话', '公司名称'],
    version: '2.0.0',
    category: 'notification',
    status: 'active',
    isDefault: true,
    createdBy: 'user_001',
    createdAt: '2025-05-20T11:00:00.000Z',
    updatedAt: '2026-02-28T16:00:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2025-05-21T09:00:00.000Z'
  },
  {
    id: 'tpl_004',
    name: '节日问候模板（待审核）',
    description: '春节、中秋等传统节日问候邮件模板，正在审核中。',
    content: '尊敬的{{客户姓名}}：\n\n{{节日名称}}将至，{{祝福语}}！\n\n感谢您一路相伴。值此佳节，为您准备了专属节日礼遇{{活动详情}}。\n\n{{公司名称}}祝您和家人节日快乐、阖家幸福！',
    variables: ['客户姓名', '节日名称', '祝福语', '活动详情', '公司名称'],
    version: '1.0.0',
    category: 'greeting',
    status: 'draft',
    isDefault: false,
    createdBy: 'user_003',
    createdAt: '2026-06-10T13:00:00.000Z',
    updatedAt: '2026-06-12T10:00:00.000Z'
  },
  {
    id: 'tpl_005',
    name: '旧版营销邮件模板（废弃）',
    description: '已废弃的旧版营销模板，不再使用。',
    content: '【旧版模板内容】',
    variables: [],
    version: '1.5.0',
    category: 'marketing',
    status: 'deprecated',
    isDefault: false,
    createdBy: 'user_001',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2025-06-30T23:59:59.000Z',
    approvedBy: 'user_001',
    approvedAt: '2024-01-02T09:00:00.000Z'
  }
]

export const mockPrompts: PromptVersion[] = [
  {
    id: 'prompt_001',
    name: '通用邮件生成器 v3',
    systemPrompt: '你是一个专业的金融行业邮件撰写助手。你的任务是根据用户提供的信息生成专业、合规、得体的中文邮件。你需要严格遵守以下规则：1. 语气正式且友好；2. 绝不使用绝对化用语（如"最"、"第一"、"100%安全"等）；3. 涉及金融产品必须包含风险提示；4. 所有收益率必须标注为"预期收益"；5. 必须保护客户隐私。',
    userPrompt: '请根据以下信息为客户生成邮件：\n【客户姓名】：{{customer_name}}\n【邮件主题】：{{email_topic}}\n【关键信息】：{{key_information}}\n【邮件类别】：{{email_category}}\n\n要求：结构清晰，开头问候，正文内容充实，结尾礼貌。',
    temperature: 0.6,
    maxTokens: 2048,
    topP: 0.9,
    version: '3.2.0',
    model: 'gpt-4',
    status: 'active',
    changeLog: '优化金融合规相关规则，增加对私募基金宣传的合规检查。',
    createdBy: 'user_001',
    createdAt: '2025-12-01T10:00:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2025-12-05T14:00:00.000Z',
    accuracy: 96.5,
    testCasesPassed: 193,
    testCasesTotal: 200
  },
  {
    id: 'prompt_002',
    name: '营销邮件专用生成器',
    systemPrompt: '你是营销邮件专家，擅长撰写有吸引力但合规的金融营销邮件。核心原则：1. 吸引客户但不夸大；2. 必须包含免责声明和风险提示；3. 禁止承诺收益；4. 必须提供退订选项；5. 符合《广告法》和金融监管要求。',
    userPrompt: '请为以下活动创建营销邮件：\n【活动名称】：{{activity_name}}\n【活动时间】：{{activity_time}}\n【目标客户】：{{target_audience}}\n【核心卖点】：{{key_selling_points}}\n\n请创建完整的营销邮件，包括吸引人的邮件标题。',
    temperature: 0.8,
    maxTokens: 3072,
    topP: 0.92,
    version: '2.0.0',
    model: 'gpt-4',
    status: 'active',
    changeLog: '调整温度参数使邮件更有吸引力，同时加强合规检查。',
    createdBy: 'user_001',
    createdAt: '2026-01-15T11:00:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2026-01-20T10:00:00.000Z',
    accuracy: 93.2,
    testCasesPassed: 186,
    testCasesTotal: 200
  },
  {
    id: 'prompt_003',
    name: '客服回复助手 v2.1 Beta',
    systemPrompt: '你是客户服务邮件回复助手。根据客户咨询内容，提供准确、专业、耐心的回复。要求：1. 先理解客户问题再回答；2. 无法确定的内容请建议转人工；3. 语气温暖有同理心；4. 必要时提供多个解决方案。',
    userPrompt: '客户信息：\n姓名：{{customer_name}}\n\n客户邮件内容：\n{{customer_email}}\n\n请生成回复邮件，确保专业且友好。',
    temperature: 0.5,
    maxTokens: 2048,
    topP: 0.88,
    version: '2.1.0',
    model: 'gpt-4o-mini',
    status: 'testing',
    changeLog: '测试新版本模型 gpt-4o-mini，提升响应速度，降低成本。正在 A/B 测试中。',
    createdBy: 'user_001',
    createdAt: '2026-06-01T09:00:00.000Z',
    accuracy: undefined,
    testCasesPassed: 45,
    testCasesTotal: 80
  },
  {
    id: 'prompt_004',
    name: '通用邮件生成器 v2（历史版本）',
    systemPrompt: '【旧版提示词】你是邮件助手。',
    userPrompt: '生成邮件：{{input}}',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    version: '2.1.5',
    model: 'gpt-3.5-turbo',
    status: 'deprecated',
    changeLog: '已被 v3 版本替代，停止使用。',
    createdBy: 'user_001',
    createdAt: '2025-06-01T00:00:00.000Z',
    approvedBy: 'user_001',
    approvedAt: '2025-06-05T09:00:00.000Z',
    accuracy: 88.0,
    testCasesPassed: 176,
    testCasesTotal: 200
  }
]

export const mockEmails: EmailDraft[] = [
  {
    id: 'email_001',
    subject: '祝您生日快乐！专属生日礼遇已为您备好',
    recipient: 'wang.xiaoming@example.com',
    recipientName: '王小明',
    content: '尊敬的王小明先生：\n\n在这个特别的日子里，我们全体员工祝您生日快乐！感谢您一直以来对我们的信任与支持。\n\n为您送上一份生日专属礼遇：价值188元的理财抵扣券，可用于购买指定理财产品。\n\n如有任何需要，请随时联系您的专属客户经理李经理 138-xxxx-xxxx。\n\n祝您生活愉快！\n\nXX银行客户服务团队',
    status: 'sent',
    priority: 'normal',
    category: 'greeting',
    templateId: 'tpl_001',
    promptId: 'prompt_001',
    knowledgeIds: ['kb_001'],
    riskLevel: 'none',
    aiSuggestion: '内容合规，可直接发送。',
    generatedBy: 'user_003',
    reviewedBy: 'user_002',
    sentBy: 'user_003',
    createdAt: '2026-06-15T09:00:00.000Z',
    updatedAt: '2026-06-15T10:30:00.000Z',
    reviewedAt: '2026-06-15T09:30:00.000Z',
    sentAt: '2026-06-15T10:30:00.000Z'
  },
  {
    id: 'email_002',
    subject: '为您精选稳健型理财方案 | 预期收益4.5%起',
    recipient: 'zhang.lan@example.com',
    recipientName: '张女士',
    content: '尊敬的张女士：\n\n根据您的稳健型风险偏好，我们为您精选了以下产品：\n\n【产品名称】：稳盈宝90天\n【预期收益】：年化4.5%\n【风险等级】：R2（稳健型）\n【投资期限】：90天\n\n风险提示：理财非存款，产品有风险，投资须谨慎。以上收益率为预期收益率，不代表实际收益。\n\n如需进一步了解，请联系专属客户经理。\n\nXX银行理财团队',
    status: 'approved',
    priority: 'high',
    category: 'marketing',
    templateId: 'tpl_002',
    promptId: 'prompt_002',
    knowledgeIds: ['kb_002', 'kb_007'],
    riskLevel: 'low',
    riskItems: [
      { type: '合规提醒', description: '建议检查预期收益表述是否符合最新监管要求', level: 'low', suggestion: '增加"业绩比较基准"字样' }
    ],
    aiSuggestion: '整体合规，建议优化风险提示位置。',
    generatedBy: 'user_003',
    reviewedBy: 'user_002',
    createdAt: '2026-06-18T14:00:00.000Z',
    updatedAt: '2026-06-19T11:00:00.000Z',
    reviewedAt: '2026-06-19T11:00:00.000Z'
  },
  {
    id: 'email_003',
    subject: '【紧急】您的账户发生异常登录操作',
    recipient: 'liu.wei@example.com',
    recipientName: '刘先生',
    cc: ['security@company.com'],
    content: '尊敬的刘先生：\n\n您好！系统监测到您的账户发生以下操作：\n\n【操作类型】：异地登录尝试\n【操作时间】：2026年6月20日 03:25:18\n【登录地点】：海外IP\n【关联账户】：尾号6688\n\n如果这是您本人操作，请忽略本邮件。如果不是您本人操作，请立即拨打客服热线400-xxx-xxxx或登录APP紧急冻结账户。\n\nXX银行安全中心',
    status: 'sent',
    priority: 'urgent',
    category: 'notification',
    templateId: 'tpl_003',
    promptId: 'prompt_001',
    knowledgeIds: ['kb_006'],
    riskLevel: 'critical',
    riskItems: [
      { type: '安全风险', description: '账户疑似被盗用', level: 'critical', suggestion: '建议立即冻结账户并联系客户' }
    ],
    aiSuggestion: '安全通知类邮件，必须立即发送。',
    generatedBy: 'system',
    sentBy: 'system',
    createdAt: '2026-06-20T03:25:20.000Z',
    updatedAt: '2026-06-20T03:26:00.000Z',
    sentAt: '2026-06-20T03:26:00.000Z'
  },
  {
    id: 'email_004',
    subject: '关于您咨询的基金定投问题的回复',
    recipient: 'chen.jing@example.com',
    recipientName: '陈女士',
    content: '尊敬的陈女士：\n\n您好！感谢您的来信咨询。\n\n关于您咨询的基金定投问题，回复如下：\n1. 定投的优势是平滑市场波动风险，适合长期投资；\n2. 建议定投期限不少于3年；\n3. 您可以根据自身情况选择每周或每月定投。\n\n如需预约理财经理详细沟通，请回复本邮件或致电客服热线。\n\nXX银行客户服务部',
    status: 'pending_review',
    priority: 'normal',
    category: 'service',
    promptId: 'prompt_003',
    knowledgeIds: ['kb_007'],
    riskLevel: 'low',
    aiSuggestion: '客服回复内容正确，等待复核。',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T14:00:00.000Z',
    updatedAt: '2026-06-20T14:30:00.000Z'
  },
  {
    id: 'email_005',
    subject: '【活动邀请】夏日理财季 享专属收益',
    recipient: 'zhao.qiang@example.com',
    recipientName: '赵先生',
    content: '尊敬的赵先生：\n\n夏日理财季火热开启！新客专享最高预期5.5%收益产品，限量发售！\n\n绝对保本保收益，业内最高回报！错过再等一年！！！\n\n点击链接立即购买：xxx\n\nXX银行',
    status: 'rejected',
    priority: 'normal',
    category: 'marketing',
    templateId: 'tpl_002',
    promptId: 'prompt_002',
    riskLevel: 'high',
    riskItems: [
      { type: '合规违规', description: '使用了"绝对保本保收益"绝对化用语', level: 'high', suggestion: '删除绝对化表述，添加风险提示' },
      { type: '合规违规', description: '使用了"业内最高回报"绝对化用语', level: 'high', suggestion: '修改为客观描述' },
      { type: '风险提示缺失', description: '邮件中缺少必要的风险提示', level: 'medium', suggestion: '在邮件显著位置增加风险提示' }
    ],
    aiSuggestion: '【高风险】存在多处合规问题，必须修改后重新提交。',
    generatedBy: 'user_003',
    reviewedBy: 'user_002',
    createdAt: '2026-06-17T16:00:00.000Z',
    updatedAt: '2026-06-18T09:00:00.000Z',
    reviewedAt: '2026-06-18T09:00:00.000Z'
  },
  {
    id: 'email_006',
    subject: '6月月报 - 您的专属资产报告已生成',
    recipient: 'sun.yue@example.com',
    recipientName: '孙女士',
    content: '尊敬的孙女士：\n\n您的6月资产报告已生成。本月您的总资产较上月增长2.3%，表现优于同风险等级平均水平。\n\n登录APP查看详细报告和个性化建议。',
    status: 'ai_generated',
    priority: 'normal',
    category: 'notification',
    promptId: 'prompt_001',
    riskLevel: 'none',
    aiSuggestion: '内容正常。',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T15:00:00.000Z',
    updatedAt: '2026-06-20T15:10:00.000Z'
  },
  {
    id: 'email_007',
    subject: '关于近期APP更新的说明',
    recipient: 'zhou.tao@example.com',
    recipientName: '周先生',
    content: '尊敬的周先生：\n\n近期我们对APP进行了升级更新：1. 新增智能理财助手；2. 优化资产展示。',
    status: 'draft',
    priority: 'low',
    category: 'notification',
    knowledgeIds: ['kb_010'],
    riskLevel: 'none',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T16:00:00.000Z',
    updatedAt: '2026-06-20T16:05:00.000Z'
  },
  {
    id: 'email_008',
    subject: '您关注的产品开放申购啦',
    recipient: 'wu.fang@example.com',
    recipientName: '吴女士',
    content: '尊敬的吴女士：您关注的稳盈宝180天产品今日开放申购，预期收益4.8%。',
    status: 'approved',
    priority: 'high',
    category: 'marketing',
    riskLevel: 'low',
    generatedBy: 'user_003',
    reviewedBy: 'user_002',
    createdAt: '2026-06-19T09:00:00.000Z',
    updatedAt: '2026-06-19T10:00:00.000Z',
    reviewedAt: '2026-06-19T10:00:00.000Z'
  },
  {
    id: 'email_009',
    subject: '投诉处理进展通知',
    recipient: 'zheng.yong@example.com',
    recipientName: '郑先生',
    content: '尊敬的郑先生：您6月18日的投诉正在处理中，我们将在3个工作日内给予答复。',
    status: 'pending_review',
    priority: 'high',
    category: 'service',
    knowledgeIds: ['kb_004'],
    riskLevel: 'medium',
    aiSuggestion: '建议补充具体处理进度信息。',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T10:00:00.000Z',
    updatedAt: '2026-06-20T10:30:00.000Z'
  },
  {
    id: 'email_010',
    subject: '关于您的账户信息更新确认',
    recipient: 'feng.min@example.com',
    recipientName: '冯女士',
    content: '尊敬的冯女士：您提交的个人信息变更申请已审核通过。',
    status: 'sent',
    priority: 'normal',
    category: 'notification',
    riskLevel: 'none',
    generatedBy: 'user_003',
    sentBy: 'user_003',
    createdAt: '2026-06-19T14:00:00.000Z',
    sentAt: '2026-06-19T15:00:00.000Z'
  },
  {
    id: 'email_011',
    subject: '【最牛产品】稳赚不赔，收益最高！',
    recipient: 'han.gang@example.com',
    recipientName: '韩先生',
    content: '最牛理财产品来了！稳赚不赔，业内最高收益！错过今天再等一年！',
    status: 'rejected',
    priority: 'normal',
    category: 'marketing',
    riskLevel: 'critical',
    riskItems: [
      { type: '违规宣传', description: '"最牛"、"最高"违反广告法', level: 'high' },
      { type: '违规承诺', description: '"稳赚不赔"违规承诺保本收益', level: 'critical' }
    ],
    aiSuggestion: '严重违规，已驳回。',
    generatedBy: 'user_003',
    reviewedBy: 'user_002',
    createdAt: '2026-06-16T11:00:00.000Z',
    reviewedAt: '2026-06-16T14:00:00.000Z'
  },
  {
    id: 'email_012',
    subject: '新功能体验邀请',
    recipient: 'deng.lin@example.com',
    recipientName: '邓女士',
    content: '尊敬的邓女士，诚邀您体验我们新上线的智能理财助手功能。',
    status: 'ai_generated',
    priority: 'normal',
    category: 'marketing',
    riskLevel: 'none',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T11:00:00.000Z'
  },
  {
    id: 'email_013',
    subject: '您的贷款还款提醒',
    recipient: 'cao.zhi@example.com',
    recipientName: '曹先生',
    content: '尊敬的曹先生，您的贷款将于6月25日到期，请提前准备还款资金。',
    status: 'pending_review',
    priority: 'urgent',
    category: 'notification',
    riskLevel: 'low',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T09:00:00.000Z'
  },
  {
    id: 'email_014',
    subject: '基金定投扣款成功通知',
    recipient: 'peng.xia@example.com',
    recipientName: '彭女士',
    content: '尊敬的彭女士，您的定投计划本月扣款成功，扣款金额1000元。',
    status: 'sent',
    priority: 'normal',
    category: 'notification',
    riskLevel: 'none',
    generatedBy: 'system',
    sentBy: 'system',
    createdAt: '2026-06-18T08:00:00.000Z',
    sentAt: '2026-06-18T08:05:00.000Z'
  },
  {
    id: 'email_015',
    subject: '【草稿】关于客户沙龙活动的邀请',
    recipient: 'liao.yuan@example.com',
    recipientName: '廖先生',
    content: '',
    status: 'draft',
    priority: 'normal',
    category: 'event',
    riskLevel: 'none',
    generatedBy: 'user_003',
    createdAt: '2026-06-20T17:00:00.000Z'
  }
]

export const mockReviews: ReviewRecord[] = [
  {
    id: 'review_001',
    emailId: 'email_001',
    emailSubject: '祝您生日快乐！专属生日礼遇已为您备好',
    reviewerId: 'user_002',
    reviewerName: '张复核',
    result: 'approved',
    comments: '内容合规，无风险问题，同意通过。',
    riskLevelAfter: 'none',
    createdAt: '2026-06-15T09:30:00.000Z'
  },
  {
    id: 'review_002',
    emailId: 'email_002',
    emailSubject: '为您精选稳健型理财方案 | 预期收益4.5%起',
    reviewerId: 'user_002',
    reviewerName: '张复核',
    result: 'modified',
    comments: '已要求优化风险提示的表述，修改后通过。',
    modifications: '在邮件开头增加"理财非存款，产品有风险"的显著提示。',
    riskLevelAfter: 'low',
    createdAt: '2026-06-19T11:00:00.000Z'
  },
  {
    id: 'review_003',
    emailId: 'email_005',
    emailSubject: '【活动邀请】夏日理财季 享专属收益',
    reviewerId: 'user_002',
    reviewerName: '张复核',
    result: 'rejected',
    comments: '存在多处严重合规问题，必须全部修改后重新提交。',
    riskLevelAfter: 'none',
    createdAt: '2026-06-18T09:00:00.000Z'
  },
  {
    id: 'review_004',
    emailId: 'email_008',
    emailSubject: '您关注的产品开放申购啦',
    reviewerId: 'user_002',
    reviewerName: '张复核',
    result: 'approved',
    comments: '内容简短合规，通过。',
    riskLevelAfter: 'low',
    createdAt: '2026-06-19T10:00:00.000Z'
  },
  {
    id: 'review_005',
    emailId: 'email_011',
    emailSubject: '【最牛产品】稳赚不赔，收益最高！',
    reviewerId: 'user_001',
    reviewerName: '系统管理员',
    result: 'rejected',
    comments: '严重违反广告法和金融监管规定，驳回，并对邮件创建人进行合规培训提醒。',
    riskLevelAfter: 'none',
    createdAt: '2026-06-16T14:00:00.000Z'
  },
  {
    id: 'review_006',
    emailId: 'email_010',
    emailSubject: '关于您的账户信息更新确认',
    reviewerId: 'user_002',
    reviewerName: '张复核',
    result: 'approved',
    comments: '正常通知邮件，通过。',
    riskLevelAfter: 'none',
    createdAt: '2026-06-19T14:30:00.000Z'
  }
]

export const mockRisks: RiskSample[] = [
  {
    id: 'risk_001',
    emailId: 'email_005',
    emailSubject: '【活动邀请】夏日理财季 享专属收益',
    riskType: '绝对化用语',
    riskLevel: 'high',
    description: '邮件中使用了"绝对保本保收益"的绝对化承诺用语，违反《广告法》第9条及金融监管相关规定。',
    originalContent: '绝对保本保收益，业内最高回报！',
    suggestedContent: '该产品为R2稳健型，历史业绩比较基准为4.5%-5.5%。理财非存款，产品有风险，投资须谨慎。',
    detectedAt: '2026-06-17T16:10:00.000Z',
    handled: true,
    handledBy: 'user_002',
    handledAt: '2026-06-18T09:05:00.000Z',
    handlerComment: '已驳回邮件，通知创建人修改，并进行合规提醒。',
    sampleCategory: 'compliance_violation'
  },
  {
    id: 'risk_002',
    emailId: 'email_005',
    emailSubject: '【活动邀请】夏日理财季 享专属收益',
    riskType: '绝对化用语',
    riskLevel: 'high',
    description: '使用了"业内最高回报"绝对化宣传用语，缺乏事实依据。',
    originalContent: '业内最高回报！',
    suggestedContent: '该产品在同类风险等级产品中具有较强的竞争力。',
    detectedAt: '2026-06-17T16:10:01.000Z',
    handled: true,
    handledBy: 'user_002',
    handledAt: '2026-06-18T09:05:00.000Z',
    handlerComment: '已一并驳回处理。',
    sampleCategory: 'compliance_violation'
  },
  {
    id: 'risk_003',
    emailId: 'email_005',
    emailSubject: '【活动邀请】夏日理财季 享专属收益',
    riskType: '风险提示缺失',
    riskLevel: 'medium',
    description: '营销邮件未在显著位置包含风险提示，不符合金融营销合规要求。',
    originalContent: '（邮件全文缺少风险提示）',
    suggestedContent: '在邮件开头或结尾增加：风险提示：理财非存款，产品有风险，投资须谨慎。本产品由XX银行发行与管理，代销机构不承担产品的投资、兑付和风险管理责任。',
    detectedAt: '2026-06-17T16:10:02.000Z',
    handled: true,
    handledBy: 'user_002',
    handledAt: '2026-06-18T09:05:00.000Z',
    handlerComment: '已驳回，要求补充。',
    sampleCategory: 'missing_disclaimer'
  },
  {
    id: 'risk_004',
    emailId: 'email_011',
    emailSubject: '【最牛产品】稳赚不赔，收益最高！',
    riskType: '多项严重违规',
    riskLevel: 'critical',
    description: '邮件标题和内容同时包含多个严重违规用语："最牛"、"最高"违反广告法；"稳赚不赔"违规承诺保本。属于高风险典型样本。',
    originalContent: '标题：【最牛产品】稳赚不赔，收益最高！\n正文：最牛理财产品来了！稳赚不赔，业内最高收益！',
    suggestedContent: '【稳健精选】历史业绩优秀 风控严格\n正文中删除所有绝对化用语，增加风险提示。',
    detectedAt: '2026-06-16T11:20:00.000Z',
    handled: true,
    handledBy: 'user_001',
    handledAt: '2026-06-16T14:10:00.000Z',
    handlerComment: '作为典型风险样本纳入培训教材，对创建人进行约谈。',
    sampleCategory: 'critical_violation'
  },
  {
    id: 'risk_005',
    emailId: 'email_002',
    emailSubject: '为您精选稳健型理财方案 | 预期收益4.5%起',
    riskType: '表述优化建议',
    riskLevel: 'low',
    description: '预期收益表述可进一步优化，建议增加"业绩比较基准"的合规表述。',
    originalContent: '【预期收益】：年化4.5%',
    suggestedContent: '【业绩比较基准】：年化4.5%（该收益不代表未来表现）',
    detectedAt: '2026-06-18T14:20:00.000Z',
    handled: true,
    handledBy: 'user_002',
    handledAt: '2026-06-19T11:05:00.000Z',
    handlerComment: '已通知修改后通过。',
    sampleCategory: 'minor_optimization'
  },
  {
    id: 'risk_006',
    emailId: 'email_003',
    emailSubject: '【紧急】您的账户发生异常登录操作',
    riskType: '安全事件',
    riskLevel: 'critical',
    description: '监测到客户账户发生海外IP的异常登录尝试，可能涉及账户盗用。',
    originalContent: '系统安全事件记录',
    detectedAt: '2026-06-20T03:25:18.000Z',
    handled: true,
    handledBy: 'system',
    handledAt: '2026-06-20T03:26:00.000Z',
    handlerComment: '已自动发送通知邮件并临时冻结可疑登录。建议人工跟进确认客户是否受影响。',
    sampleCategory: 'security_incident'
  },
  {
    id: 'risk_007',
    emailId: 'email_009',
    emailSubject: '投诉处理进展通知',
    riskType: '客户体验风险',
    riskLevel: 'medium',
    description: '投诉回复过于简略，可能引起客户不满升级。建议补充具体进度和责任人信息。',
    originalContent: '您6月18日的投诉正在处理中，我们将在3个工作日内给予答复。',
    suggestedContent: '您于2026年6月18日提交的关于【具体投诉事项】的投诉，目前由【处理部门】专员【姓名/工号】跟进中，预计将在6月23日前给您正式答复。如有紧急事项，可拨打专线电话。',
    detectedAt: '2026-06-20T10:15:00.000Z',
    handled: false,
    sampleCategory: 'customer_experience'
  }
]

export const mockAnalytics: AnalyticsData = {
  dailyStats: Array.from({ length: 30 }, (_, i) => {
    const date = new Date('2026-06-01')
    date.setDate(date.getDate() + i)
    return {
      date: date.toISOString().split('T')[0],
      emailsGenerated: Math.floor(80 + Math.random() * 80),
      emailsReviewed: Math.floor(60 + Math.random() * 60),
      emailsSent: Math.floor(50 + Math.random() * 50),
      reviewsPending: Math.floor(10 + Math.random() * 30),
      avgResponseTime: +(2 + Math.random() * 3).toFixed(1)
    }
  }),
  categoryStats: [
    { category: '营销类', count: 456, percentage: 35.6 },
    { category: '通知类', count: 389, percentage: 30.4 },
    { category: '客服类', count: 234, percentage: 18.3 },
    { category: '问候类', count: 145, percentage: 11.3 },
    { category: '活动类', count: 56, percentage: 4.4 }
  ],
  riskStats: [
    { level: 'none', count: 890, percentage: 69.5 },
    { level: 'low', count: 234, percentage: 18.3 },
    { level: 'medium', count: 112, percentage: 8.8 },
    { level: 'high', count: 35, percentage: 2.7 },
    { level: 'critical', count: 9, percentage: 0.7 }
  ],
  costStats: Array.from({ length: 30 }, (_, i) => {
    const date = new Date('2026-06-01')
    date.setDate(date.getDate() + i)
    const tokensIn = Math.floor(50000 + Math.random() * 50000)
    const tokensOut = Math.floor(30000 + Math.random() * 40000)
    return {
      date: date.toISOString().split('T')[0],
      tokensIn,
      tokensOut,
      cost: +(((tokensIn + tokensOut) / 1000) * 0.015).toFixed(2),
      model: 'gpt-4'
    }
  }),
  performance: {
    totalEmails: 1280,
    aiAccuracyRate: 94.7,
    reviewEfficiency: 89.2,
    avgProcessingTime: 3.2,
    riskDetectionRate: 97.8
  },
  topTemplates: [
    { name: '客户生日祝福邮件', usageCount: 312 },
    { name: '理财产品推荐邮件', usageCount: 256 },
    { name: '账户异动通知', usageCount: 178 },
    { name: '月报通知', usageCount: 134 },
    { name: '定投扣款通知', usageCount: 98 }
  ],
  reviewerStats: [
    { name: '张复核', reviewed: 456, approved: 398 },
    { name: '系统管理员', reviewed: 89, approved: 76 },
    { name: '王质检', reviewed: 234, approved: 208 }
  ]
}

export const mockLogs: OperationLog[] = [
  { id: 'log_001', userId: 'user_001', userName: '系统管理员', module: 'auth', action: 'login', targetId: 'user_001', description: '用户登录系统', ip: '192.168.1.100', status: 'success', createdAt: '2026-06-20T09:00:00.000Z' },
  { id: 'log_002', userId: 'user_003', userName: '李运营', module: 'email', action: 'generate', targetId: 'email_006', targetName: '6月月报 - 您的专属资产报告已生成', description: 'AI生成邮件', status: 'success', createdAt: '2026-06-20T15:00:00.000Z' },
  { id: 'log_003', userId: 'user_003', userName: '李运营', module: 'email', action: 'create', targetId: 'email_007', description: '创建邮件草稿', status: 'success', createdAt: '2026-06-20T16:00:00.000Z' },
  { id: 'log_004', userId: 'user_002', userName: '张复核', module: 'review', action: 'approve', targetId: 'email_002', targetName: '为您精选稳健型理财方案', description: '复核通过邮件', status: 'success', createdAt: '2026-06-19T11:00:00.000Z' },
  { id: 'log_005', userId: 'user_002', userName: '张复核', module: 'review', action: 'reject', targetId: 'email_005', targetName: '夏日理财季活动邀请', description: '复核驳回邮件', status: 'success', createdAt: '2026-06-18T09:00:00.000Z' },
  { id: 'log_006', userId: 'user_001', userName: '系统管理员', module: 'knowledge', action: 'update', targetId: 'kb_010', targetName: 'APP功能更新说明2026Q2', description: '更新知识库条目', status: 'success', createdAt: '2026-06-10T11:00:00.000Z' },
  { id: 'log_007', userId: 'user_001', userName: '系统管理员', module: 'template', action: 'create', targetId: 'tpl_004', targetName: '节日问候模板', description: '创建话术模板', status: 'success', createdAt: '2026-06-10T13:00:00.000Z' },
  { id: 'log_008', userId: 'user_001', userName: '系统管理员', module: 'prompt', action: 'approve', targetId: 'prompt_001', targetName: '通用邮件生成器 v3', description: '审批通过提示词版本', status: 'success', createdAt: '2025-12-05T14:00:00.000Z' },
  { id: 'log_009', userId: 'user_003', userName: '李运营', module: 'email', action: 'send', targetId: 'email_001', targetName: '生日祝福邮件', description: '发送邮件', ip: '192.168.1.105', status: 'success', createdAt: '2026-06-15T10:30:00.000Z' },
  { id: 'log_010', userId: 'user_001', userName: '系统管理员', module: 'risk', action: 'update', targetId: 'risk_004', description: '处理高风险样本', status: 'success', createdAt: '2026-06-16T14:10:00.000Z' },
  { id: 'log_011', userId: 'user_001', userName: '系统管理员', module: 'analytics', action: 'export', description: '导出6月统计报表', status: 'success', createdAt: '2026-06-20T17:00:00.000Z' },
  { id: 'log_012', userId: 'user_002', userName: '张复核', module: 'auth', action: 'login', description: '用户登录系统', ip: '192.168.1.108', status: 'success', createdAt: '2026-06-20T08:45:00.000Z' },
  { id: 'log_013', userId: 'user_003', userName: '李运营', module: 'auth', action: 'login', description: '用户登录系统', ip: '192.168.1.105', status: 'success', createdAt: '2026-06-20T10:15:00.000Z' },
  { id: 'log_014', userId: 'user_001', userName: '系统管理员', module: 'user', action: 'update', targetId: 'user_003', description: '更新用户信息', status: 'success', createdAt: '2026-06-15T11:00:00.000Z' },
  { id: 'log_015', userId: 'unknown', userName: '未知用户', module: 'auth', action: 'login', description: '登录失败：用户名或密码错误', ip: '203.0.113.50', status: 'failed', errorMessage: 'Invalid credentials', createdAt: '2026-06-20T05:30:00.000Z' }
]

export async function mockResponse<T>(data: T, delay = 300): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}

export async function mockPaginatedResponse<T>(
  allItems: T[],
  page: number,
  pageSize: number,
  delay = 300
): Promise<PaginationResponse<T>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const total = allItems.length
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = allItems.slice(start, end)

      resolve({
        list,
        total,
        page,
        pageSize
      })
    }, delay)
  })
}
