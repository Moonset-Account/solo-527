import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import hash from '@adonisjs/core/services/hash'

export default class extends BaseSeeder {
  private async seedUsers() {
    const now = DateTime.now()
    const password = await hash.make('password123')

    const users = [
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: password,
        full_name: '系统管理员',
        role: 'admin',
        is_active: true,
        created_at: now.toISO(),
        updated_at: now.toISO()
      },
      {
        id: 2,
        username: 'ops01',
        email: 'ops01@example.com',
        password: password,
        full_name: '运营专员-张三',
        role: 'ops',
        is_active: true,
        created_at: now.toISO(),
        updated_at: now.toISO()
      },
      {
        id: 3,
        username: 'sales01',
        email: 'sales01@example.com',
        password: password,
        full_name: '销售专员-李四',
        role: 'sales',
        is_active: true,
        created_at: now.toISO(),
        updated_at: now.toISO()
      }
    ]

    await db.table('users').insert(users)
    return users
  }

  private async seedRejectReasons() {
    const now = DateTime.now()
    const reasons = [
      { id: 1, code: 'CONTENT_TONE', name: '语气不当', description: '邮件语气过于强硬或不够礼貌', category: 'content', sort_order: 1, is_active: true, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, code: 'COMPLIANCE_RISK', name: '合规风险', description: '涉及敏感承诺或不规范表述', category: 'compliance', sort_order: 2, is_active: true, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, code: 'FORMAT_ERROR', name: '格式错误', description: '邮件格式、排版或签名不规范', category: 'format', sort_order: 3, is_active: true, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, code: 'DATA_INACCURATE', name: '数据不准确', description: '引用的价格、条款或数据有误', category: 'data', sort_order: 4, is_active: true, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, code: 'MISSING_INFO', name: '信息缺失', description: '缺少必要的附件或关键信息', category: 'data', sort_order: 5, is_active: true, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 6, code: 'OTHER', name: '其他原因', description: '其他需要说明的驳回原因', category: 'other', sort_order: 99, is_active: true, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('reject_reasons').insert(reasons)
    return reasons
  }

  private async seedKnowledgeItems() {
    const now = DateTime.now()
    const items = [
      { id: 1, title: '企业版产品报价说明', content: '企业版年费为99,999元起，包含50个用户席位、SLA服务等级协议、专属客户经理、7x24小时技术支持。可根据客户需求定制模块，每个额外模块加收20%费用。', tags: JSON.stringify(['报价', '企业版', '产品']), category: 'product', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, title: '专业版产品功能清单', content: '专业版包含：多团队协作、权限管理、API接口调用（10000次/天）、数据导出、自定义报表、邮件通知集成、SSO单点登录。', tags: JSON.stringify(['功能', '专业版', '产品']), category: 'product', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, title: '标准合同条款模板', content: '合同周期默认1年，自动续费需提前30天通知。退款政策：7天无理由退款，使用量不超过总配额10%。数据保留政策：合同终止后保留30天。', tags: JSON.stringify(['合同', '条款', '法务']), category: 'legal', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, title: '数据安全与隐私合规说明', content: '本产品已通过ISO27001认证、SOC2 Type II审计。数据传输全程TLS 1.3加密，存储采用AES-256加密。支持GDPR数据导出请求，响应时间不超过30天。', tags: JSON.stringify(['安全', '合规', '隐私']), category: 'compliance', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, title: '客户成功服务流程', content: '签约后：1. 1个工作日内分配专属CSM；2. 3个工作日内完成Kickoff会议；3. 10个工作日内完成系统部署和培训；4. 月度业务回顾会议。', tags: JSON.stringify(['客户成功', '服务', '流程']), category: 'service', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 6, title: '技术支持响应时效', content: 'P0级故障（系统不可用）：15分钟响应，4小时恢复；P1级故障（核心功能异常）：30分钟响应，8小时恢复；P2级问题（功能缺陷）：2小时响应，24小时内给出方案；P3级咨询：4小时响应。', tags: JSON.stringify(['技术支持', 'SLA', '响应']), category: 'service', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 7, title: 'API接口限流策略', content: '基础版：1000次/天；专业版：10000次/天；企业版：100000次/天，可定制。突发流量允许10%溢出，超过后返回429状态码。支持批量请求，单次最多100条。', tags: JSON.stringify(['API', '限流', '技术']), category: 'technical', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 8, title: '产品更新与版本发布政策', content: '月度迭代：每月第一周发布；季度大版本：每季度首月发布；紧急补丁：24小时内发布。重大变更提前30天通知客户，提供90天兼容性过渡期。', tags: JSON.stringify(['版本', '更新', '发布']), category: 'product', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 9, title: '常见客户异议及应对话术', content: '价格贵：强调ROI，提供分期方案；竞品对比：突出差异化功能和服务质量；担心实施风险：展示成功案例，提供POC试用；数据安全顾虑：提供合规证书，允许第三方审计。', tags: JSON.stringify(['销售', '异议', '话术']), category: 'sales', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 10, title: '增值服务价格表', content: '定制开发：2000元/人天；培训服务：5000元/天（含材料）；数据迁移：30000元起；专属顾问：15000元/月；第三方集成对接：按工作量评估。', tags: JSON.stringify(['增值服务', '价格', '报价']), category: 'pricing', is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('knowledge_items').insert(items)
    return items
  }

  private async seedSpeechTemplates() {
    const now = DateTime.now()

    const templates = [
      { id: 1, name: '初次接触开场白', description: '用于首次联系潜在客户的邮件模板', category: 'outreach', created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, name: '产品报价邮件', description: '向客户发送正式报价单的邮件模板', category: 'pricing', created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, name: '合同签约跟进', description: '合同审批和签约阶段的跟进邮件', category: 'contract', created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, name: '客户续约提醒', description: '合同到期前提醒客户续约的邮件模板', category: 'renewal', created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, name: '售后感谢信', description: '签约后发送给客户的感谢邮件', category: 'retention', created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('speech_templates').insert(templates)

    const versions = [
      { id: 1, speech_template_id: 1, version: 'v1.0', content: '尊敬的{company_name} {recipient_name}：您好！我是{sender_name}，来自{our_company}。通过{source_channel}了解到贵公司在{business_area}领域的卓越表现...', variables: JSON.stringify(['company_name', 'recipient_name', 'sender_name', 'our_company', 'source_channel', 'business_area']), is_current: true, created_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, speech_template_id: 2, version: 'v1.2', content: '尊敬的{recipient_name}：感谢您对{product_name}的关注！根据我们的沟通，现向您提交正式报价方案...', variables: JSON.stringify(['recipient_name', 'product_name', 'price', 'valid_until']), is_current: true, created_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, speech_template_id: 3, version: 'v1.0', content: '尊敬的{recipient_name}：附件是贵公司的{contract_type}合同草稿，请审阅。如有任何修改意见，请随时告知...', variables: JSON.stringify(['recipient_name', 'contract_type', 'deadline']), is_current: true, created_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, speech_template_id: 4, version: 'v2.0', content: '尊敬的{recipient_name}：温馨提醒，贵公司使用的{product_name}服务将于{expiry_date}到期。为确保业务连续性...', variables: JSON.stringify(['recipient_name', 'product_name', 'expiry_date', 'renewal_price']), is_current: true, created_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, speech_template_id: 5, version: 'v1.1', content: '尊敬的{recipient_name}：感谢您选择{our_company}！我们已收到贵公司的签约回执，正式合同编号为{contract_number}...', variables: JSON.stringify(['recipient_name', 'our_company', 'contract_number', 'onboarding_date']), is_current: true, created_by: 1, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('speech_template_versions').insert(versions)

    await db.table('speech_templates').where('id', 1).update('current_version_id', 1)
    await db.table('speech_templates').where('id', 2).update('current_version_id', 2)
    await db.table('speech_templates').where('id', 3).update('current_version_id', 3)
    await db.table('speech_templates').where('id', 4).update('current_version_id', 4)
    await db.table('speech_templates').where('id', 5).update('current_version_id', 5)

    return { templates, versions }
  }

  private async seedPromptVersions() {
    const now = DateTime.now()
    const prompts = [
      {
        id: 1,
        name: '邮件生成提示词',
        prompt_type: 'email_generation',
        version: 'v3.1.0',
        system_prompt: '你是一位资深的企业销售邮件撰写专家，擅长用专业、得体且有说服力的语言撰写商务邮件。请根据用户提供的客户背景、沟通上下文和写作目标，生成符合以下要求的邮件：1. 语气专业友好，符合B2B场景；2. 结构清晰，包含开场白、核心内容、行动召唤；3. 严格遵守合规要求，不做超出授权范围的承诺；4. 引用知识库内容时，必须标注来源。',
        user_prompt_template: '客户背景：{customer_background}\n写作目标：{writing_goal}\n沟通上下文：{context}\n参考话术模板：{speech_template}\n请生成邮件主题和正文。',
        parameters: JSON.stringify({ temperature: 0.7, max_tokens: 4096, model: 'gpt-4-turbo' }),
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now.toISO(),
        updated_at: now.toISO()
      },
      {
        id: 2,
        name: '风险检测提示词',
        prompt_type: 'risk_detection',
        version: 'v2.0.0',
        system_prompt: '你是一位企业合规审查专家，负责检测销售邮件中的合规风险。请仔细分析邮件内容，识别以下类型的风险：1. 未经授权的价格承诺或折扣；2. 夸大产品功能或服务SLA；3. 不当的排他性或竞业条款表述；4. 敏感数据泄露风险；5. 其他可能违反公司政策或法律法规的内容。',
        user_prompt_template: '邮件主题：{subject}\n邮件正文：{body}\n请分析以上邮件内容，给出风险等级（low/medium/high/critical）和详细的风险说明。',
        parameters: JSON.stringify({ temperature: 0.2, max_tokens: 2048, model: 'gpt-4-turbo' }),
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now.toISO(),
        updated_at: now.toISO()
      },
      {
        id: 3,
        name: '内容润色提示词',
        prompt_type: 'content_polish',
        version: 'v1.5.0',
        system_prompt: '你是一位资深的商务文案编辑，擅长对企业邮件进行润色优化。请在保持邮件核心意思不变的前提下，进行以下优化：1. 提升语言的专业度和流畅度；2. 修正语法和拼写错误；3. 优化段落结构和逻辑衔接；4. 调整语气使其更符合商务场景。不要改变邮件中的关键信息（价格、时间、条款等）。',
        user_prompt_template: '原始邮件主题：{subject}\n原始邮件正文：{body}\n润色要求：{requirements}\n请输出润色后的邮件。',
        parameters: JSON.stringify({ temperature: 0.5, max_tokens: 4096, model: 'gpt-4-turbo' }),
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now.toISO(),
        updated_at: now.toISO()
      },
      {
        id: 4,
        name: '知识检索问答提示词',
        prompt_type: 'knowledge_qa',
        version: 'v1.2.0',
        system_prompt: '你是一位企业内部知识助手。请严格基于提供的知识库上下文回答问题。如果答案无法从上下文中得出，请明确说明"知识库中未找到相关信息"，不要编造内容。回答时请标注引用的知识库条目。',
        user_prompt_template: '问题：{question}\n知识库上下文：{context}\n请基于上下文回答问题。',
        parameters: JSON.stringify({ temperature: 0.1, max_tokens: 2048, model: 'gpt-4-turbo' }),
        is_active: true,
        created_by: 1,
        updated_by: 1,
        created_at: now.toISO(),
        updated_at: now.toISO()
      }
    ]
    await db.table('prompt_versions').insert(prompts)
    return prompts
  }

  private async seedEmailDrafts() {
    const now = DateTime.now()
    const drafts = [
      { id: 1, subject: '关于ABC科技企业版解决方案的报价函', body: '尊敬的王总：\n\n感谢您上周与我们团队的深入交流。根据ABC科技的业务需求，现提供企业版解决方案报价如下...', recipient_email: 'wangzong@abctech.com', recipient_name: '王总', customer_background: JSON.stringify({ company: 'ABC科技', industry: '制造业', size: '500-1000人', contact_person: '王总', position: 'CTO', previous_interactions: ['2024-01-10 初步需求沟通', '2024-01-15 产品演示会'] }), cited_sources: JSON.stringify([]), status: 'approved', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, speech_template_version_id: 2, generation_cost: 150, review_count: 1, created_at: now.toISO(), updated_at: now.toISO(), approved_at: now.minus({ days: 2 }).toISO() },
      { id: 2, subject: '初次合作意向沟通 - XYZ集团', body: '尊敬的李总：\n\n您好！我是XX公司的李四...', recipient_email: 'lizong@xyzgroup.com', recipient_name: '李总', customer_background: JSON.stringify({ company: 'XYZ集团', industry: '金融', size: '10000+人', channel: '展会介绍' }), cited_sources: JSON.stringify([]), status: 'reviewing', risk_level: 'medium', sales_id: 3, ops_id: 2, prompt_version_id: 1, speech_template_version_id: 1, generation_cost: 120, review_count: 0, created_at: now.toISO(), updated_at: now.toISO(), submitted_at: now.minus({ hours: 3 }).toISO() },
      { id: 3, subject: '合同条款细节确认 - Demo公司', body: '尊敬的陈经理：\n\n关于上周讨论的合同条款，我方已做如下修订...', recipient_email: 'chenjl@demo.com', recipient_name: '陈经理', customer_background: JSON.stringify({ company: 'Demo公司', industry: '互联网', size: '200-500人' }), cited_sources: JSON.stringify([]), status: 'rejected', risk_level: 'high', risk_notes: '合同中关于数据所有权的条款表述存在歧义，建议法务部复核', sales_id: 3, ops_id: 2, prompt_version_id: 1, speech_template_version_id: 3, generation_cost: 180, review_count: 2, reject_reason_id: 2, reject_detail: '合同条款第7.2条关于数据归属的表述不够清晰，存在合规风险', created_at: now.minus({ days: 5 }).toISO(), updated_at: now.minus({ days: 1 }).toISO(), submitted_at: now.minus({ days: 4 }).toISO(), rejected_at: now.minus({ days: 1 }).toISO() },
      { id: 4, subject: '2024年度服务续约方案 - 快达物流', body: '尊敬的刘总：\n\n时光飞逝，贵公司的服务协议即将到期...', recipient_email: 'liuzong@kuaida.com', recipient_name: '刘总', customer_background: JSON.stringify({ company: '快达物流', industry: '物流', size: '1000-5000人', current_plan: '专业版', contract_start: '2023-03-01', contract_end: '2024-02-29' }), cited_sources: JSON.stringify([]), status: 'sent', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, speech_template_version_id: 4, generation_cost: 130, review_count: 1, created_at: now.minus({ days: 20 }).toISO(), updated_at: now.minus({ days: 10 }).toISO(), approved_at: now.minus({ days: 15 }).toISO(), sent_at: now.minus({ days: 10 }).toISO() },
      { id: 5, subject: '感谢您的信任 - 签约确认', body: '尊敬的赵总：\n\n衷心感谢优采电商选择与我们合作...', recipient_email: 'zhaozong@youcai.com', recipient_name: '赵总', customer_background: JSON.stringify({ company: '优采电商', industry: '电商', size: '500-1000人', plan: '企业版', contract_value: 299997 }), cited_sources: JSON.stringify([]), status: 'sent', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, speech_template_version_id: 5, generation_cost: 90, review_count: 1, created_at: now.minus({ days: 30 }).toISO(), updated_at: now.minus({ days: 28 }).toISO(), approved_at: now.minus({ days: 29 }).toISO(), sent_at: now.minus({ days: 28 }).toISO() },
      { id: 6, subject: '产品功能定制开发需求沟通', body: '尊敬的孙经理：\n\n收到您关于定制开发的需求说明...', recipient_email: 'sunjh@techfirm.com', recipient_name: '孙经理', customer_background: JSON.stringify({ company: 'TechFirm科技', industry: 'SaaS', size: '100-200人' }), cited_sources: JSON.stringify([]), status: 'draft', risk_level: null, sales_id: 3, prompt_version_id: 1, speech_template_version_id: 1, generation_cost: 200, review_count: 0, created_at: now.minus({ hours: 8 }).toISO(), updated_at: now.minus({ hours: 5 }).toISO() },
      { id: 7, subject: 'Q1季度业务回顾 - 恒基建设', body: '尊敬的周总：\n\n第一季度即将结束，特此向您汇报合作进展...', recipient_email: 'zhouzong@hengji.com', recipient_name: '周总', customer_background: JSON.stringify({ company: '恒基建设', industry: '建筑', size: '5000-10000人' }), cited_sources: JSON.stringify([]), status: 'approved', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 160, review_count: 1, created_at: now.minus({ days: 3 }).toISO(), updated_at: now.minus({ days: 1 }).toISO(), approved_at: now.minus({ days: 1 }).toISO() },
      { id: 8, subject: 'API接口使用量超限通知', body: '尊敬的技术团队：\n\n系统监测到贵公司API调用量本月已达配额的90%...', recipient_email: 'tech@bigdata.com', recipient_name: '技术负责人', customer_background: JSON.stringify({ company: 'BigData公司', industry: '大数据', current_api_usage: 9250, plan_limit: 10000 }), cited_sources: JSON.stringify([]), status: 'reviewing', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 80, review_count: 0, created_at: now.minus({ days: 1 }).toISO(), updated_at: now.toISO(), submitted_at: now.minus({ hours: 1 }).toISO() },
      { id: 9, subject: '关于POC测试的时间安排', body: '尊敬的吴总：\n\n关于贵公司提出的POC测试需求，我方已完成准备工作...', recipient_email: 'wuzong@pinnacle.com', recipient_name: '吴总', customer_background: JSON.stringify({ company: 'Pinnacle咨询', industry: '咨询', size: '50-100人' }), cited_sources: JSON.stringify([]), status: 'draft', risk_level: null, sales_id: 3, prompt_version_id: 1, speech_template_version_id: 1, generation_cost: 110, review_count: 0, created_at: now.minus({ hours: 2 }).toISO(), updated_at: now.minus({ hours: 1 }).toISO() },
      { id: 10, subject: '年度安全审计报告反馈', body: '尊敬的安全团队：\n\n附件是贵公司年度安全审计的结果报告...', recipient_email: 'security@financehub.com', recipient_name: '安全负责人', customer_background: JSON.stringify({ company: 'FinanceHub金融', industry: '金融', compliance_requirements: ['等保三级', 'PCI-DSS'] }), cited_sources: JSON.stringify([]), status: 'sent', risk_level: 'medium', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 140, review_count: 2, created_at: now.minus({ days: 45 }).toISO(), updated_at: now.minus({ days: 40 }).toISO(), approved_at: now.minus({ days: 42 }).toISO(), sent_at: now.minus({ days: 40 }).toISO() },
      { id: 11, subject: '合作伙伴佣金结算确认', body: '尊敬的郑总：\n\n现将Q4季度合作伙伴佣金明细发送给您...', recipient_email: 'zhengzong@partner.com', recipient_name: '郑总', customer_background: JSON.stringify({ company: 'Partner公司', type: '渠道合作伙伴', commission_period: 'Q4 2023' }), cited_sources: JSON.stringify([]), status: 'archived', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 70, review_count: 1, created_at: now.minus({ days: 90 }).toISO(), updated_at: now.minus({ days: 85 }).toISO(), approved_at: now.minus({ days: 88 }).toISO(), sent_at: now.minus({ days: 85 }).toISO() },
      { id: 12, subject: '用户培训会议日程安排', body: '尊敬的培训负责人：\n\n根据贵公司的需求，我们安排了以下培训课程...', recipient_email: 'training@edutech.com', recipient_name: '培训主管', customer_background: JSON.stringify({ company: 'EduTech教育', industry: '教育' }), cited_sources: JSON.stringify([]), status: 'approved', risk_level: 'low', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 95, review_count: 1, created_at: now.minus({ days: 4 }).toISO(), updated_at: now.minus({ days: 2 }).toISO(), approved_at: now.minus({ days: 2 }).toISO() },
      { id: 13, subject: '数据迁移服务项目启动会通知', body: '尊敬的项目组：\n\n数据迁移项目启动会定于下周一召开...', recipient_email: 'pm@globalsvc.com', recipient_name: '项目经理', customer_background: JSON.stringify({ company: 'GlobalSvc全球服务', industry: '服务外包', size: '5000+人' }), cited_sources: JSON.stringify([]), status: 'draft', risk_level: null, sales_id: 3, prompt_version_id: 1, generation_cost: 125, review_count: 0, created_at: now.minus({ minutes: 30 }).toISO(), updated_at: now.toISO() },
      { id: 14, subject: '紧急：SLA服务故障进展通报', body: '尊敬的运维负责人：\n\n关于今天上午出现的服务中断问题...', recipient_email: 'ops@missioncritical.com', recipient_name: '运维总监', customer_background: JSON.stringify({ company: 'MissionCritical', industry: '医疗', critical_sla: true }), cited_sources: JSON.stringify([]), status: 'reviewing', risk_level: 'critical', risk_notes: '涉及P0级故障沟通，需要法务和管理层双审', sales_id: 3, ops_id: 2, prompt_version_id: 2, generation_cost: 220, review_count: 0, created_at: now.minus({ hours: 6 }).toISO(), updated_at: now.toISO(), submitted_at: now.minus({ hours: 2 }).toISO() },
      { id: 15, subject: '新功能上线通知 - 智能分析模块', body: '尊敬的产品负责人：\n\n很高兴通知贵公司，智能分析模块已正式上线...', recipient_email: 'product@innovate.io', recipient_name: '产品总监', customer_background: JSON.stringify({ company: 'Innovate创新科技', industry: 'AI', beta_tester: true }), cited_sources: JSON.stringify([]), status: 'rejected', risk_level: 'medium', sales_id: 3, ops_id: 2, prompt_version_id: 1, generation_cost: 100, review_count: 1, reject_reason_id: 1, reject_detail: '语气过于随意，"很高兴通知"不够专业，建议调整为更正式的商务措辞', created_at: now.minus({ days: 8 }).toISO(), updated_at: now.minus({ days: 6 }).toISO(), submitted_at: now.minus({ days: 7 }).toISO(), rejected_at: now.minus({ days: 6 }).toISO() }
    ]
    await db.table('email_drafts').insert(drafts)
    return drafts
  }

  private async seedCitedSources() {
    const now = DateTime.now()
    const sources = [
      { id: 1, email_draft_id: 1, knowledge_item_id: 1, source_title: '企业版产品报价说明', source_content: '企业版年费为99,999元起，包含50个用户席位...', relevance_score: 0.9523, created_by: 3, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, email_draft_id: 1, knowledge_item_id: 5, source_title: '客户成功服务流程', source_content: '签约后：1. 1个工作日内分配专属CSM...', relevance_score: 0.8234, created_by: 3, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, email_draft_id: 10, knowledge_item_id: 4, source_title: '数据安全与隐私合规说明', source_content: '本产品已通过ISO27001认证、SOC2 Type II审计...', relevance_score: 0.9812, created_by: 3, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, email_draft_id: 4, knowledge_item_id: 8, source_title: '产品更新与版本发布政策', source_content: '月度迭代：每月第一周发布...', relevance_score: 0.7156, created_by: 3, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, email_draft_id: 8, knowledge_item_id: 7, source_title: 'API接口限流策略', source_content: '专业版：10000次/天...', relevance_score: 0.9988, created_by: 3, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('cited_sources').insert(sources)
    return sources
  }

  private async seedReviewRecords() {
    const now = DateTime.now()
    const records = [
      { id: 1, email_draft_id: 1, reviewer_id: 2, action: 'approved', comments: '报价信息准确，语气专业，可以通过', edits_made: JSON.stringify({}), created_at: now.minus({ days: 2 }).toISO(), updated_at: now.minus({ days: 2 }).toISO() },
      { id: 2, email_draft_id: 3, reviewer_id: 2, action: 'requested_changes', comments: '需要修改数据归属条款，请与法务确认后重新提交', edits_made: JSON.stringify({ section_7_2: '需要法务审阅' }), created_at: now.minus({ days: 3 }).toISO(), updated_at: now.minus({ days: 3 }).toISO() },
      { id: 3, email_draft_id: 3, reviewer_id: 2, action: 'rejected', comments: '经法务复核，条款表述仍有合规风险，建议重新起草', edits_made: JSON.stringify({}), reject_reason_id: 2, created_at: now.minus({ days: 1 }).toISO(), updated_at: now.minus({ days: 1 }).toISO() },
      { id: 4, email_draft_id: 4, reviewer_id: 2, action: 'approved', comments: '续约提醒内容完整，可以发送', edits_made: JSON.stringify({ paragraph_2: '补充了优惠活动说明' }), created_at: now.minus({ days: 15 }).toISO(), updated_at: now.minus({ days: 15 }).toISO() },
      { id: 5, email_draft_id: 5, reviewer_id: 2, action: 'approved', comments: '感谢邮件格式标准', edits_made: JSON.stringify({}), created_at: now.minus({ days: 29 }).toISO(), updated_at: now.minus({ days: 29 }).toISO() },
      { id: 6, email_draft_id: 10, reviewer_id: 2, action: 'requested_changes', comments: '建议补充合规证书的具体版本号', edits_made: JSON.stringify({ attachments: '缺失PDF扫描件' }), created_at: now.minus({ days: 44 }).toISO(), updated_at: now.minus({ days: 44 }).toISO() },
      { id: 7, email_draft_id: 10, reviewer_id: 2, action: 'approved', comments: '已补充证书信息，通过', edits_made: JSON.stringify({}), created_at: now.minus({ days: 42 }).toISO(), updated_at: now.minus({ days: 42 }).toISO() },
      { id: 8, email_draft_id: 15, reviewer_id: 2, action: 'rejected', comments: '语气不够正式，需要调整', edits_made: JSON.stringify({}), reject_reason_id: 1, created_at: now.minus({ days: 6 }).toISO(), updated_at: now.minus({ days: 6 }).toISO() }
    ]
    await db.table('review_records').insert(records)
    return records
  }

  private async seedRiskSamples() {
    const now = DateTime.now()
    const samples = [
      { id: 1, title: '未经授权的折扣承诺', content: '"我们可以给您提供5折的特殊优惠，这是我权限内能给出的最低价了。"', risk_level: 'high', category: 'pricing', risk_description: '销售人员在邮件中承诺超出自身权限的折扣比例，可能导致合同纠纷或利润损失。', correct_handling: '应说明"具体优惠方案需经销售经理审批后正式回函"，不做口头或书面的超权限承诺。', tags: JSON.stringify(['折扣', '价格', '权限']), is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 2, title: '夸大产品功能', content: '"我们的系统支持100%的准确率，绝不会出错。"', risk_level: 'medium', category: 'product', risk_description: '使用绝对化语言夸大产品效果，违反广告法，可能构成虚假宣传。', correct_handling: '应使用客观数据描述，如"在标准测试集上准确率可达99.5%"，并说明适用条件。', tags: JSON.stringify(['产品', '宣传', '广告法']), is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 3, title: '不当的排他条款', content: '"选择了我们的服务后，您就不能再使用其他任何同类产品。"', risk_level: 'critical', category: 'compliance', risk_description: '强制排他性条款可能违反反垄断法，构成不正当竞争。', correct_handling: '通过服务质量争取客户，不设置不正当的排他性约束。如需排他合作，需法务审核并提供相应对价。', tags: JSON.stringify(['排他', '反垄断', '合规']), is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 4, title: '敏感客户数据泄露风险', content: '在邮件正文中直接粘贴客户的API密钥："您的密钥是 sk-xxxx-yyyy-zzzz，请妥善保管。"', risk_level: 'critical', category: 'security', risk_description: '通过邮件明文传输密钥等敏感信息，一旦邮件被截获或转发，将造成严重安全事故。', correct_handling: '密钥应通过加密的安全渠道传输，邮件中只提供获取指引，不直接包含敏感信息。', tags: JSON.stringify(['安全', '密钥', '数据泄露']), is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() },
      { id: 5, title: 'SLA承诺模糊', content: '"我们保证系统全年可用，出了问题随时找我们。"', risk_level: 'medium', category: 'sla', risk_description: 'SLA承诺不具体，客户可能据此提出超出合同范围的索赔要求。', correct_handling: '明确引用合同中的SLA条款，说明故障等级、响应时间、赔偿方式的具体约定。', tags: JSON.stringify(['SLA', '服务承诺', '合同']), is_active: true, created_by: 1, updated_by: 1, created_at: now.toISO(), updated_at: now.toISO() }
    ]
    await db.table('risk_samples').insert(samples)
    return samples
  }

  private async seedCostRecords() {
    const now = DateTime.now()
    const records = []
    let id = 1
    for (let i = 0; i < 20; i++) {
      const costType = ['generation', 'generation', 'generation', 'review', 'embedding', 'other'][i % 6] as any
      const promptTokens = Math.floor(Math.random() * 4000) + 500
      const completionTokens = costType === 'embedding' ? 0 : Math.floor(Math.random() * 2000) + 200
      const totalTokens = promptTokens + completionTokens
      const costUsd = (totalTokens * (costType === 'embedding' ? 0.0000001 : 0.00001)).toFixed(6)
      records.push({
        id: id++,
        user_id: [3, 3, 3, 2, 1, 3, 2, 3, 3, 2][i % 10],
        email_draft_id: i < 15 ? i + 1 : null,
        cost_type: costType,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        cost_cents: Math.ceil(parseFloat(costUsd) * 100),
        model_name: ['gpt-4-turbo', 'gpt-4-turbo', 'text-embedding-3-large', 'gpt-4-turbo', 'gpt-4-turbo'][i % 5],
        metadata: JSON.stringify({ batch: i < 10 ? 'morning' : 'afternoon' }),
        created_at: now.minus({ hours: i * 5 }).toISO(),
        updated_at: now.minus({ hours: i * 5 }).toISO()
      })
    }
    await db.table('cost_records').insert(records)
    return records
  }

  private async seedOperationLogs() {
    const now = DateTime.now()
    const logs = []
    const actions = [
      { action: 'login', resource_type: 'session', user_id: 1 },
      { action: 'create', resource_type: 'knowledge_item', user_id: 1 },
      { action: 'update', resource_type: 'knowledge_item', user_id: 1 },
      { action: 'generate', resource_type: 'email_draft', user_id: 3 },
      { action: 'submit_review', resource_type: 'email_draft', user_id: 3 },
      { action: 'review_approve', resource_type: 'email_draft', user_id: 2 },
      { action: 'review_reject', resource_type: 'email_draft', user_id: 2 },
      { action: 'send', resource_type: 'email_draft', user_id: 3 },
      { action: 'create', resource_type: 'speech_template', user_id: 1 },
      { action: 'create_version', resource_type: 'speech_template', user_id: 1 },
      { action: 'login', resource_type: 'session', user_id: 3 },
      { action: 'login', resource_type: 'session', user_id: 2 },
      { action: 'generate', resource_type: 'email_draft', user_id: 3 },
      { action: 'generate', resource_type: 'email_draft', user_id: 3 },
      { action: 'update', resource_type: 'prompt_version', user_id: 1 },
      { action: 'search', resource_type: 'knowledge_base', user_id: 3 },
      { action: 'export', resource_type: 'cost_report', user_id: 1 },
      { action: 'create', resource_type: 'risk_sample', user_id: 1 },
      { action: 'archive', resource_type: 'email_draft', user_id: 3 },
      { action: 'logout', resource_type: 'session', user_id: 2 }
    ]
    for (let i = 0; i < 20; i++) {
      logs.push({
        id: i + 1,
        user_id: actions[i].user_id,
        action: actions[i].action,
        resource_type: actions[i].resource_type,
        resource_id: [null, 1, 2, 1, 1, 1, 3, 4, 1, 1, null, null, 6, 7, 1, null, null, 1, 11, null][i],
        ip_address: `192.168.${10 + (i % 3)}.${100 + i}`,
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        old_values: JSON.stringify(i % 2 === 0 ? {} : { status: 'draft' }),
        new_values: JSON.stringify(i % 2 === 0 ? {} : { status: 'reviewing' }),
        created_at: now.minus({ hours: i * 3 + 1 }).toISO(),
        updated_at: now.minus({ hours: i * 3 + 1 }).toISO()
      })
    }
    await db.table('operation_logs').insert(logs)
    return logs
  }

  async run() {
    await this.seedUsers()
    await this.seedRejectReasons()
    await this.seedKnowledgeItems()
    await this.seedSpeechTemplates()
    await this.seedPromptVersions()
    await this.seedEmailDrafts()
    await this.seedCitedSources()
    await this.seedReviewRecords()
    await this.seedRiskSamples()
    await this.seedCostRecords()
    await this.seedOperationLogs()
  }
}
