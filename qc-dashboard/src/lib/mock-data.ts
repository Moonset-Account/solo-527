import type {
  Session,
  Inspection,
  KnowledgeEntry,
  KnowledgeHit,
  KnowledgeVersion,
  Issue,
  IssueNote,
  Attachment,
  ModificationRecord,
  FilterPreset,
  ChatMessage,
  DashboardMetrics,
  TimeoutRiskItem,
} from "./types"

const sessions: Session[] = [
  { id: "s-001", order_no: "ORD-20240315-001", agent_name: "张丽华", status: "pending", score: null, service_rating: null, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-20T09:15:00Z", updated_at: "2024-06-20T09:15:00Z" },
  { id: "s-002", order_no: "ORD-20240315-002", agent_name: "李明远", status: "inspecting", score: null, service_rating: 4, knowledge_version: "v2.3", has_timeout_risk: true, created_at: "2024-06-20T10:30:00Z", updated_at: "2024-06-20T10:30:00Z" },
  { id: "s-003", order_no: "ORD-20240315-003", agent_name: "王芳芳", status: "completed", score: 92, service_rating: 5, knowledge_version: "v2.2", has_timeout_risk: false, created_at: "2024-06-20T11:00:00Z", updated_at: "2024-06-20T14:30:00Z" },
  { id: "s-004", order_no: "ORD-20240314-004", agent_name: "陈建国", status: "completed", score: 78, service_rating: 3, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-19T08:20:00Z", updated_at: "2024-06-19T12:00:00Z" },
  { id: "s-005", order_no: "ORD-20240314-005", agent_name: "赵丽华", status: "appealed", score: 65, service_rating: 2, knowledge_version: "v2.1", has_timeout_risk: true, created_at: "2024-06-19T09:45:00Z", updated_at: "2024-06-19T16:30:00Z" },
  { id: "s-006", order_no: "ORD-20240314-006", agent_name: "刘伟", status: "pending", score: null, service_rating: null, knowledge_version: "v2.3", has_timeout_risk: true, created_at: "2024-06-19T10:00:00Z", updated_at: "2024-06-19T10:00:00Z" },
  { id: "s-007", order_no: "ORD-20240313-007", agent_name: "张丽华", status: "completed", score: 88, service_rating: 4, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-18T13:20:00Z", updated_at: "2024-06-18T17:00:00Z" },
  { id: "s-008", order_no: "ORD-20240313-008", agent_name: "李明远", status: "completed", score: 95, service_rating: 5, knowledge_version: "v2.2", has_timeout_risk: false, created_at: "2024-06-18T14:10:00Z", updated_at: "2024-06-18T18:20:00Z" },
  { id: "s-009", order_no: "ORD-20240312-009", agent_name: "王芳芳", status: "inspecting", score: null, service_rating: 3, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-17T11:30:00Z", updated_at: "2024-06-17T11:30:00Z" },
  { id: "s-010", order_no: "ORD-20240312-010", agent_name: "陈建国", status: "completed", score: 71, service_rating: 2, knowledge_version: "v2.1", has_timeout_risk: true, created_at: "2024-06-17T15:00:00Z", updated_at: "2024-06-17T20:30:00Z" },
  { id: "s-011", order_no: "ORD-20240311-011", agent_name: "赵丽华", status: "completed", score: 84, service_rating: 4, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-16T09:00:00Z", updated_at: "2024-06-16T13:00:00Z" },
  { id: "s-012", order_no: "ORD-20240311-012", agent_name: "刘伟", status: "pending", score: null, service_rating: null, knowledge_version: "v2.3", has_timeout_risk: false, created_at: "2024-06-16T10:30:00Z", updated_at: "2024-06-16T10:30:00Z" },
]

const inspections: Inspection[] = [
  { id: "i-001", session_id: "s-003", inspector_name: "质检员周明", attitude_score: 24, professional_score: 23, response_score: 22, compliance_score: 23, total_score: 92, result: "pass", notes: "服务态度优秀，专业知识扎实", processing_result: "resolved", created_at: "2024-06-20T14:00:00Z", updated_at: "2024-06-20T14:30:00Z" },
  { id: "i-002", session_id: "s-004", inspector_name: "质检员周明", attitude_score: 20, professional_score: 19, response_score: 20, compliance_score: 19, total_score: 78, result: "warning", notes: "响应速度偏慢，规范用语需要加强", processing_result: "escalated", created_at: "2024-06-19T11:30:00Z", updated_at: "2024-06-19T12:00:00Z" },
  { id: "i-003", session_id: "s-005", inspector_name: "质检员李芳", attitude_score: 16, professional_score: 17, response_score: 15, compliance_score: 17, total_score: 65, result: "fail", notes: "态度冷淡，多次未按规范回复，超时风险高", processing_result: "escalated", created_at: "2024-06-19T15:00:00Z", updated_at: "2024-06-19T16:30:00Z" },
  { id: "i-004", session_id: "s-007", inspector_name: "质检员李芳", attitude_score: 22, professional_score: 22, response_score: 21, compliance_score: 23, total_score: 88, result: "pass", notes: "整体良好，个别话术可优化", processing_result: "resolved", created_at: "2024-06-18T16:00:00Z", updated_at: "2024-06-18T17:00:00Z" },
  { id: "i-005", session_id: "s-008", inspector_name: "质检员周明", attitude_score: 25, professional_score: 24, response_score: 23, compliance_score: 23, total_score: 95, result: "pass", notes: "优秀示范案例", processing_result: "resolved", created_at: "2024-06-18T17:30:00Z", updated_at: "2024-06-18T18:20:00Z" },
  { id: "i-006", session_id: "s-010", inspector_name: "质检员李芳", attitude_score: 18, professional_score: 18, response_score: 17, compliance_score: 18, total_score: 71, result: "warning", notes: "多处超时，需加强时效意识", processing_result: "pending", created_at: "2024-06-17T19:00:00Z", updated_at: "2024-06-17T20:30:00Z" },
  { id: "i-007", session_id: "s-011", inspector_name: "质检员周明", attitude_score: 21, professional_score: 21, response_score: 21, compliance_score: 21, total_score: 84, result: "pass", notes: "服务质量稳定", processing_result: "resolved", created_at: "2024-06-16T12:00:00Z", updated_at: "2024-06-16T13:00:00Z" },
]

const knowledgeEntries: KnowledgeEntry[] = [
  { id: "k-001", title: "退货退款流程标准话术", content: "尊敬的客户，您的退货申请已收到，我们将在3个工作日内完成审核。审核通过后退款将在1-5个工作日原路返回。", category: "answer", version: 3, status: "published", hit_count: 156, created_by: "知识库管理员", created_at: "2024-03-01T10:00:00Z", updated_at: "2024-06-15T10:00:00Z" },
  { id: "k-002", title: "换货操作教程", content: "1. 登录账户进入订单详情 2. 选择申请换货 3. 填写换货原因 4. 提交申请等待审核 5. 收到审核通过通知后寄回商品 6. 确认寄回后等待新商品发出", category: "tutorial", version: 2, status: "published", hit_count: 89, created_by: "知识库管理员", created_at: "2024-02-15T09:00:00Z", updated_at: "2024-05-20T14:00:00Z" },
  { id: "k-003", title: "物流异常处理指南", content: "当客户反馈物流异常时：1. 核实物流单号 2. 联系物流公司查询 3. 超过48小时无更新可申请赔偿 4. 补发或退款由客户选择", category: "tutorial", version: 4, status: "published", hit_count: 234, created_by: "知识库管理员", created_at: "2024-01-10T08:00:00Z", updated_at: "2024-06-18T16:00:00Z" },
  { id: "k-004", title: "优惠券使用规则说明", content: "优惠券使用规则：1. 优惠券不可叠加使用 2. 每笔订单仅限一张 3. 过期优惠券不可恢复 4. 特价商品不参与优惠 5. 退款后优惠券不退回", category: "answer", version: 1, status: "published", hit_count: 67, created_by: "知识库管理员", created_at: "2024-04-01T10:00:00Z", updated_at: "2024-04-01T10:00:00Z" },
  { id: "k-005", title: "商品质量投诉处理流程", content: "1. 记录客户投诉详情 2. 要求客户提供照片凭证 3. 判定质量问题等级 4. 轻微问题：补偿优惠券 5. 严重问题：退货退款+赔偿 6. 极端问题：升级至品控部门", category: "tutorial", version: 2, status: "published", hit_count: 112, created_by: "知识库管理员", created_at: "2024-03-20T11:00:00Z", updated_at: "2024-06-10T09:00:00Z" },
  { id: "k-006", title: "会员积分兑换说明", content: "会员积分可兑换：1. 满减券（100积分=5元）2. 运费券（50积分=1次免运费）3. 实物礼品（详见积分商城）积分有效期12个月", category: "answer", version: 1, status: "draft", hit_count: 23, created_by: "知识库管理员", created_at: "2024-05-01T10:00:00Z", updated_at: "2024-05-01T10:00:00Z" },
  { id: "k-007", title: "售后时效标准", content: "各类售后处理时效：退货审核3个工作日，换货审核2个工作日，维修7个工作日，退款1-5个工作日。超时自动升级至主管处理。", category: "answer", version: 5, status: "published", hit_count: 198, created_by: "知识库管理员", created_at: "2024-01-01T08:00:00Z", updated_at: "2024-06-19T11:00:00Z" },
  { id: "k-008", title: "价格保护政策", content: "购买后7天内如遇降价可申请差价补偿。需提供原订单截图和当前价格截图。特价促销活动不参与价保。", category: "answer", version: 2, status: "archived", hit_count: 45, created_by: "知识库管理员", created_at: "2024-02-10T09:00:00Z", updated_at: "2024-05-15T10:00:00Z" },
]

const knowledgeHits: KnowledgeHit[] = [
  { id: "kh-001", entry_id: "k-001", entry_title: "退货退款流程标准话术", session_id: "s-002", role: "agent", knowledge_version: 3, hit_at: "2024-06-20T10:35:00Z" },
  { id: "kh-002", entry_id: "k-003", entry_title: "物流异常处理指南", session_id: "s-002", role: "customer", knowledge_version: 4, hit_at: "2024-06-20T10:38:00Z" },
  { id: "kh-003", entry_id: "k-007", entry_title: "售后时效标准", session_id: "s-002", role: "system", knowledge_version: 5, hit_at: "2024-06-20T10:40:00Z" },
  { id: "kh-004", entry_id: "k-005", entry_title: "商品质量投诉处理流程", session_id: "s-005", role: "agent", knowledge_version: 2, hit_at: "2024-06-19T10:20:00Z" },
  { id: "kh-005", entry_id: "k-001", entry_title: "退货退款流程标准话术", session_id: "s-005", role: "customer", knowledge_version: 3, hit_at: "2024-06-19T10:25:00Z" },
  { id: "kh-006", entry_id: "k-003", entry_title: "物流异常处理指南", session_id: "s-010", role: "agent", knowledge_version: 4, hit_at: "2024-06-17T15:30:00Z" },
  { id: "kh-007", entry_id: "k-007", entry_title: "售后时效标准", session_id: "s-010", role: "agent", knowledge_version: 5, hit_at: "2024-06-17T15:35:00Z" },
]

const knowledgeVersions: KnowledgeVersion[] = [
  { id: "kv-001", entry_id: "k-001", version: 1, content: "基础退货退款话术", diff_summary: "初始版本", published_by: "知识库管理员", published_at: "2024-03-01T10:00:00Z" },
  { id: "kv-002", entry_id: "k-001", version: 2, content: "增加退款时效说明", diff_summary: "新增退款到账时效说明", published_by: "知识库管理员", published_at: "2024-04-15T10:00:00Z" },
  { id: "kv-003", entry_id: "k-001", version: 3, content: "增加原路返回说明", diff_summary: "补充退款原路返回规则", published_by: "知识库管理员", published_at: "2024-06-15T10:00:00Z" },
  { id: "kv-004", entry_id: "k-003", version: 1, content: "基础物流异常处理", diff_summary: "初始版本", published_by: "知识库管理员", published_at: "2024-01-10T08:00:00Z" },
  { id: "kv-005", entry_id: "k-003", version: 2, content: "增加赔偿流程", diff_summary: "新增48小时无更新赔偿流程", published_by: "知识库管理员", published_at: "2024-03-10T09:00:00Z" },
  { id: "kv-006", entry_id: "k-003", version: 3, content: "增加客户选择权", diff_summary: "新增客户可在补发和退款间选择", published_by: "知识库管理员", published_at: "2024-05-01T10:00:00Z" },
  { id: "kv-007", entry_id: "k-003", version: 4, content: "完整流程优化", diff_summary: "优化全部流程措辞和时效要求", published_by: "知识库管理员", published_at: "2024-06-18T16:00:00Z" },
]

const issues: Issue[] = [
  { id: "iss-001", title: "退货审核超时未处理", description: "多个订单退货审核超过3个工作日未处理", category: "流程违规", duplicate_count: 5, status: "open", has_timeout_risk: true, processing_result: "pending", related_session_count: 5, created_at: "2024-06-19T10:00:00Z", updated_at: "2024-06-20T09:00:00Z" },
  { id: "iss-002", title: "客服未使用标准话术", description: "部分客服在退货场景中未按规范使用标准话术", category: "话术规范", duplicate_count: 3, status: "processing", has_timeout_risk: false, processing_result: "escalated", related_session_count: 3, created_at: "2024-06-18T14:00:00Z", updated_at: "2024-06-19T11:00:00Z" },
  { id: "iss-003", title: "物流异常响应慢", description: "客户反馈物流异常后，客服响应时间超过15分钟", category: "响应时效", duplicate_count: 8, status: "open", has_timeout_risk: true, processing_result: "pending", related_session_count: 8, created_at: "2024-06-17T09:00:00Z", updated_at: "2024-06-20T08:00:00Z" },
  { id: "iss-004", title: "退款金额计算错误", description: "使用优惠券后退款金额计算有误，未扣除优惠部分", category: "业务错误", duplicate_count: 2, status: "resolved", has_timeout_risk: false, processing_result: "resolved", related_session_count: 2, created_at: "2024-06-15T11:00:00Z", updated_at: "2024-06-17T16:00:00Z" },
  { id: "iss-005", title: "客户投诉处理不当", description: "商品质量投诉中客服态度冷淡，未按流程处理", category: "服务态度", duplicate_count: 4, status: "processing", has_timeout_risk: true, processing_result: "escalated", related_session_count: 4, created_at: "2024-06-16T13:00:00Z", updated_at: "2024-06-19T15:00:00Z" },
  { id: "iss-006", title: "换货流程指引不清", description: "客服换货指引混乱，客户多次询问仍不理解", category: "话术规范", duplicate_count: 6, status: "open", has_timeout_risk: false, processing_result: "pending", related_session_count: 6, created_at: "2024-06-18T10:00:00Z", updated_at: "2024-06-20T10:00:00Z" },
]

const issueNotes: IssueNote[] = [
  { id: "n-001", issue_id: "iss-001", author_name: "质检员周明", content: "今日新增2例退货审核超时，均为刘伟名下订单", created_at: "2024-06-20T09:00:00Z" },
  { id: "n-002", issue_id: "iss-001", author_name: "主管王刚", content: "已安排加班处理积压，预计今日清完", created_at: "2024-06-20T10:30:00Z" },
  { id: "n-003", issue_id: "iss-003", author_name: "质检员李芳", content: "物流异常响应慢主要集中在下午高峰期", created_at: "2024-06-19T16:00:00Z" },
  { id: "n-004", issue_id: "iss-005", author_name: "质检员周明", content: "已约谈相关客服，下周安排态度培训", created_at: "2024-06-19T14:00:00Z" },
  { id: "n-005", issue_id: "iss-006", author_name: "质检员李芳", content: "建议更新换货教程，增加图解步骤", created_at: "2024-06-20T10:00:00Z" },
]

const attachments: Attachment[] = [
  { id: "a-001", session_id: "s-002", file_name: "物流截图.png", file_url: "/placeholder.png", file_type: "image/png", file_size: 256000, uploaded_by: "客户", uploaded_at: "2024-06-20T10:32:00Z" },
  { id: "a-002", session_id: "s-002", file_name: "订单详情.pdf", file_url: "/placeholder.pdf", file_type: "application/pdf", file_size: 128000, uploaded_by: "系统", uploaded_at: "2024-06-20T10:33:00Z" },
  { id: "a-003", session_id: "s-005", file_name: "商品瑕疵照片.jpg", file_url: "/placeholder.jpg", file_type: "image/jpeg", file_size: 512000, uploaded_by: "客户", uploaded_at: "2024-06-19T10:15:00Z" },
  { id: "a-004", session_id: "s-005", file_name: "质检报告.docx", file_url: "/placeholder.docx", file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_size: 89000, uploaded_by: "质检员李芳", uploaded_at: "2024-06-19T15:10:00Z" },
]

const modifications: ModificationRecord[] = [
  { id: "m-001", entity_type: "inspection", entity_id: "i-002", field: "notes", old_value: "响应速度偏慢", new_value: "响应速度偏慢，规范用语需要加强", modified_by: "质检员周明", modified_at: "2024-06-19T12:00:00Z" },
  { id: "m-002", entity_type: "inspection", entity_id: "i-003", field: "processing_result", old_value: "pending", new_value: "escalated", modified_by: "质检员李芳", modified_at: "2024-06-19T16:30:00Z" },
  { id: "m-003", entity_type: "issue", entity_id: "iss-001", field: "duplicate_count", old_value: "3", new_value: "5", modified_by: "系统", modified_at: "2024-06-20T09:00:00Z" },
  { id: "m-004", entity_type: "issue", entity_id: "iss-003", field: "duplicate_count", old_value: "5", new_value: "8", modified_by: "系统", modified_at: "2024-06-20T08:00:00Z" },
  { id: "m-005", entity_type: "issue", entity_id: "iss-006", field: "status", old_value: "open", new_value: "processing", modified_by: "主管王刚", modified_at: "2024-06-19T17:00:00Z" },
]

const filterPresets: FilterPreset[] = [
  { id: "fp-001", name: "待质检会话", filters: { status: ["pending"] } },
  { id: "fp-002", name: "超时风险", filters: { has_timeout_risk: true } },
  { id: "fp-003", name: "低评分会话", filters: { service_rating: [1, 2] } },
  { id: "fp-004", name: "待复核", filters: { status: ["inspecting"] } },
]

const chatMessages: Record<string, ChatMessage[]> = {
  "s-002": [
    { id: "msg-001", session_id: "s-002", role: "customer", content: "你好，我的订单物流一直显示在途中，已经5天了没有更新，请问怎么回事？", timestamp: "2024-06-20T10:30:00Z" },
    { id: "msg-002", session_id: "s-002", role: "agent", content: "您好，非常抱歉给您带来不便。我来帮您查询一下物流情况，请您提供订单号。", timestamp: "2024-06-20T10:31:00Z" },
    { id: "msg-003", session_id: "s-002", role: "customer", content: "订单号是 ORD-20240315-002", timestamp: "2024-06-20T10:32:00Z" },
    { id: "msg-004", session_id: "s-002", role: "agent", content: "感谢您提供订单号，我正在为您核实物流信息。经查询您的包裹在转运中心滞留，我已联系物流公司加急处理。", timestamp: "2024-06-20T10:35:00Z" },
    { id: "msg-005", session_id: "s-002", role: "customer", content: "那大概还要多久才能到？我已经等了很久了。", timestamp: "2024-06-20T10:37:00Z" },
    { id: "msg-006", session_id: "s-002", role: "agent", content: "根据物流公司反馈，预计2天内可以送达。如果48小时内仍无更新，您可以申请补发或退款。非常理解您的心情，我们会持续跟进。", timestamp: "2024-06-20T10:38:00Z" },
    { id: "msg-007", session_id: "s-002", role: "system", content: "[系统提示] 当前会话已超过标准响应时效，请注意跟进", timestamp: "2024-06-20T10:40:00Z" },
  ],
  "s-005": [
    { id: "msg-008", session_id: "s-005", role: "customer", content: "我收到的商品有破损，要求退货！", timestamp: "2024-06-19T10:00:00Z" },
    { id: "msg-009", session_id: "s-005", role: "agent", content: "您好，可以退货的。", timestamp: "2024-06-19T10:05:00Z" },
    { id: "msg-010", session_id: "s-005", role: "customer", content: "就这样？不需要我提供什么凭证吗？退货运费谁出？", timestamp: "2024-06-19T10:06:00Z" },
    { id: "msg-011", session_id: "s-005", role: "agent", content: "您在订单页面申请退货就行，运费的问题我不太确定。", timestamp: "2024-06-19T10:10:00Z" },
    { id: "msg-012", session_id: "s-005", role: "customer", content: "你这回答也太敷衍了！我要投诉！", timestamp: "2024-06-19T10:12:00Z" },
  ],
}

const dashboardMetrics: DashboardMetrics = {
  today_inspected: 7,
  avg_score: 82.1,
  pending_count: 3,
  timeout_risk_count: 3,
}

const timeoutRiskDistribution: TimeoutRiskItem[] = [
  { label: "退货审核", count: 5 },
  { label: "物流异常", count: 8 },
  { label: "换货处理", count: 3 },
  { label: "投诉响应", count: 4 },
  { label: "退款处理", count: 2 },
]

const trendData = [
  { date: "06-14", score: 79 },
  { date: "06-15", score: 82 },
  { date: "06-16", score: 84 },
  { date: "06-17", score: 78 },
  { date: "06-18", score: 86 },
  { date: "06-19", score: 72 },
  { date: "06-20", score: 82 },
]

export const mockData = {
  sessions,
  inspections,
  knowledgeEntries,
  knowledgeHits,
  knowledgeVersions,
  issues,
  issueNotes,
  attachments,
  modifications,
  filterPresets,
  chatMessages,
  dashboardMetrics,
  timeoutRiskDistribution,
  trendData,
}
