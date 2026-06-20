Rails.logger = Logger.new(STDOUT)
Rails.logger.level = Logger::INFO

puts "🌱 开始创建种子数据..."

departments_data = [
  { name: '技术研发部', description: '负责公司产品的技术研发与架构设计' },
  { name: '产品设计部', description: '负责产品需求分析、交互设计与视觉设计' },
  { name: '市场运营部', description: '负责市场推广、品牌建设与用户运营' },
  { name: '客户服务部', description: '负责客户关系维护与售后服务' },
  { name: '人力资源部', description: '负责人员招聘、培训与绩效管理' },
  { name: '财务部', description: '负责财务管理、预算控制与审计合规' },
  { name: '总经办', description: '公司战略决策与跨部门协调' }
]

departments = {}
departments_data.each do |data|
  dept = Department.find_or_create_by!(name: data[:name]) do |d|
    d.description = data[:description]
  end
  departments[data[:name]] = dept
  puts "✅ 部门: #{dept.name}"
end

users_data = [
  { email: 'ceo@company.com', name: '张明远', role: :executive, department: departments['总经办'], password: 'Password123!' },
  { email: 'cto@company.com', name: '李思强', role: :executive, department: departments['技术研发部'], password: 'Password123!' },
  { email: 'admin@company.com', name: '王雪琴', role: :admin, department: departments['总经办'], password: 'Password123!' },
  { email: 'pm@company.com', name: '赵子轩', role: :user, department: departments['产品设计部'], password: 'Password123!' },
  { email: 'tech1@company.com', name: '陈建华', role: :user, department: departments['技术研发部'], password: 'Password123!' },
  { email: 'tech2@company.com', name: '刘婷婷', role: :user, department: departments['技术研发部'], password: 'Password123!' },
  { email: 'tech3@company.com', name: '周俊杰', role: :user, department: departments['技术研发部'], password: 'Password123!' },
  { email: 'design1@company.com', name: '孙美琪', role: :user, department: departments['产品设计部'], password: 'Password123!' },
  { email: 'design2@company.com', name: '黄文博', role: :user, department: departments['产品设计部'], password: 'Password123!' },
  { email: 'market1@company.com', name: '钱小燕', role: :user, department: departments['市场运营部'], password: 'Password123!' },
  { email: 'market2@company.com', name: '吴大海', role: :user, department: departments['市场运营部'], password: 'Password123!' },
  { email: 'cs@company.com', name: '郑丽华', role: :user, department: departments['客户服务部'], password: 'Password123!' },
  { email: 'hr@company.com', name: '冯浩然', role: :user, department: departments['人力资源部'], password: 'Password123!' },
  { email: 'finance@company.com', name: '许文婷', role: :user, department: departments['财务部'], password: 'Password123!' }
]

users = {}
users_data.each do |data|
  user = User.find_or_create_by!(email: data[:email]) do |u|
    u.name = data[:name]
    u.role = data[:role]
    u.department = data[:department]
    u.password = data[:password]
    u.password_confirmation = data[:password]
  end
  users[data[:email]] = user
  puts "✅ 用户: #{user.name} (#{user.role_name} - #{user.department&.name})"
end

ceo = users['ceo@company.com']
cto = users['cto@company.com']
admin = users['admin@company.com']
pm = users['pm@company.com']
tech1 = users['tech1@company.com']
tech2 = users['tech2@company.com']
tech3 = users['tech3@company.com']
design1 = users['design1@company.com']
design2 = users['design2@company.com']
market1 = users['market1@company.com']
market2 = users['market2@company.com']
cs = users['cs@company.com']
hr = users['hr@company.com']

tickets_data = [
  {
    title: '客户管理系统性能优化',
    description: "当前客户管理系统在大数据量查询时响应时间超过5秒，严重影响客服人员工作效率。\n\n需要优化：\n1. 数据库查询索引优化\n2. 列表分页逻辑调整\n3. 引入缓存机制",
    status: :completed,
    priority: :urgent,
    submitter: cs,
    assignee: tech1,
    department: departments['技术研发部'],
    process_node: '复盘总结',
    deadline: 30.days.ago,
    completed_at: 25.days.ago,
    with_review: true,
    eff_before: 40,
    eff_after: 85
  },
  {
    title: '移动端APP全新改版设计',
    description: "根据用户调研反馈，移动端APP需要进行UI/UX全面升级：\n1. 首页布局重构\n2. 深色模式支持\n3. 交互流程简化\n4. 无障碍访问优化",
    status: :in_progress,
    priority: :high,
    submitter: market1,
    assignee: design1,
    department: departments['产品设计部'],
    process_node: '方案设计',
    deadline: 20.days.from_now,
    with_timeline: true
  },
  {
    title: '2024年度招聘系统升级',
    description: "现有招聘系统存在简历筛选效率低、面试安排混乱等问题。\n升级内容：\n1. AI简历初筛\n2. 在线面试集成\n3. Offer流程自动化\n4. 数据分析看板",
    status: :pending,
    priority: :normal,
    submitter: hr,
    assignee: tech2,
    department: departments['技术研发部'],
    process_node: '需求分析',
    deadline: 45.days.from_now
  },
  {
    title: '市场活动数据看板建设',
    description: "市场部门需要一个实时数据看板，追踪各渠道活动效果：\n1. 投放数据实时同步\n2. ROI自动计算\n3. A/B测试数据对比\n4. 异常报警机制",
    status: :in_progress,
    priority: :high,
    submitter: market2,
    assignee: tech3,
    department: departments['技术研发部'],
    process_node: '开发实施',
    deadline: 10.days.from_now,
    with_review: true,
    eff_before: 55,
    eff_after: 78
  },
  {
    title: '财务报销流程数字化',
    description: "目前报销仍以纸质流程为主，效率低下且容易出错。\n需要实现：\n1. 移动端拍照上传发票\n2. OCR自动识别\n3. 审批流程线上化\n4. 财务系统自动对接",
    status: :exception,
    priority: :urgent,
    submitter: users['finance@company.com'],
    assignee: pm,
    department: departments['产品设计部'],
    process_node: '需求分析',
    deadline: 5.days.ago,
    with_remark: '第三方接口对接遇到问题，需要协调'
  },
  {
    title: '订单系统异常率上升排查',
    description: "近一周订单系统异常率从0.5%上升到3.2%，需要紧急排查：\n1. 支付回调失败\n2. 库存扣减不一致\n3. 物流同步延迟",
    status: :completed,
    priority: :urgent,
    submitter: pm,
    assignee: cto,
    department: departments['技术研发部'],
    process_node: '复盘总结',
    deadline: 15.days.ago,
    completed_at: 12.days.ago,
    with_review: true,
    eff_before: 62,
    eff_after: 95
  },
  {
    title: '用户隐私合规整改',
    description: "应对最新数据安全法规要求，进行全面隐私合规整改：\n1. 用户协议更新\n2. 隐私中心建设\n3. 数据脱敏处理\n4. 第三方审计准备",
    status: :in_progress,
    priority: :urgent,
    submitter: ceo,
    assignee: admin,
    department: departments['总经办'],
    process_node: '测试验证',
    deadline: 3.days.from_now
  },
  {
    title: '客户满意度调研系统',
    description: "建立系统化的客户满意度调研机制：\n1. NPS问卷自动推送\n2. 多渠道触达\n3. 情感分析\n4. 闭环跟进流程",
    status: :pending,
    priority: :normal,
    submitter: cs,
    assignee: design2,
    department: departments['产品设计部'],
    process_node: '需求提交',
    deadline: 60.days.from_now
  }
]

tickets_data.each do |data|
  ticket_params = data.except(:with_review, :eff_before, :eff_after, :with_timeline, :with_remark)
  ticket = Ticket.create!(ticket_params)

  PaperTrail.request.whodunnit = ticket.submitter_id.to_s
  ticket.create_audit_log(ticket.submitter, 'create_ticket', nil, nil, nil, '通过种子数据创建')

  puts "✅ 需求: #{ticket.title} (#{ticket.status_name})"

  if data[:with_review]
    conclusion = ticket.create_review_conclusion!(
      content: "经过项目团队两周的集中攻坚，问题已得到根本解决。\n\n主要工作：\n1. 完成了全链路性能压测\n2. 识别并修复了核心瓶颈\n3. 建立了持续监控机制\n\n整体效果显著，用户反馈良好。",
      root_cause: "历史数据量过大，原有表结构设计未考虑数据归档方案，加上缺少合理的索引规划，导致查询性能随数据增长急剧下降。",
      improvement: "1. 冷热数据分离，超过6个月数据自动归档\n2. 新增复合索引覆盖高频查询场景\n3. 引入Redis热点数据缓存层\n4. 建立慢查询监控与预警机制",
      result: "核心接口响应时间从5.2秒降低到0.3秒以内，系统可用性达到99.9%，用户投诉量下降80%。",
      efficiency_before: data[:eff_before] || 50,
      efficiency_after: data[:eff_after] || 80,
      reviewer: cto,
      reviewed_at: ticket.completed_at || Time.current
    )
    ticket.create_audit_log(cto, 'create_review', nil, nil, nil, '复盘结论已完成')
    puts "   📝 复盘结论已创建 (效率: #{conclusion.efficiency_before}% → #{conclusion.efficiency_after}%)"
  end

  if data[:with_remark]
    ticket.create_audit_log(pm, 'add_remark', nil, nil, nil, data[:with_remark])
    puts "   💡 添加备注: #{data[:with_remark]}"
  end
end

PaperTrail.request.whodunnit = nil

puts ""
puts "🎉 种子数据创建完成！"
puts ""
puts "📧 测试账号:"
puts "   总经办: ceo@company.com / Password123!"
puts "   管理员: admin@company.com / Password123!"
puts "   项目PM: pm@company.com / Password123!"
puts "   研发人员: tech1@company.com / Password123!"
puts ""
