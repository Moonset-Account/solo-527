import { generateRandomTokens, calculateCost, round } from '../utils/helpers.js'

export interface LLMChatOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface LLMResponse {
  content: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  costUsd: number
  modelName: string
  finishReason: string
}

export interface LLMAdapter {
  chat(systemPrompt: string, userPrompt: string, options?: LLMChatOptions): Promise<LLMResponse>
}

export class MockLLM implements LLMAdapter {
  private static instance: MockLLM

  static getInstance(): MockLLM {
    if (!MockLLM.instance) {
      MockLLM.instance = new MockLLM()
    }
    return MockLLM.instance
  }

  private emailTemplates = [
    (params: any) => {
      const company = params.companyName || '贵公司'
      const contact = params.contactPerson || '相关负责人'
      const industry = params.industry || '行业'
      const pain = params.painPoints || '业务挑战'
      return `尊敬的${contact}：

您好！我是XX公司的销售经理，一直关注${company}在${industry}领域的发展。

通过行业分析，我们注意到许多同类型企业正面临${pain}等问题。我们的解决方案已帮助多家${industry}企业成功应对类似挑战，实现了：

• 运营效率提升 30% 以上
• 客户满意度显著改善
• 综合成本降低 25%

我们的核心优势在于：
1. 定制化解决方案，适配不同规模企业需求
2. 专业的实施团队，平均交付周期缩短 40%
3. 7x24 小时技术支持，保障业务稳定运行

希望能有机会与您深入交流，探讨如何帮助${company}实现业务增长。方便时请回复此邮件，或直接拨打我的电话：138-XXXX-XXXX。

期待与您的合作！

此致
敬礼

销售经理 XXX
XX公司
电话：138-XXXX-XXXX
邮箱：sales@xxcompany.com
官网：www.xxcompany.com`
    },
    (params: any) => {
      const company = params.companyName || '贵公司'
      const contact = params.contactPerson || '先生/女士'
      const budget = params.budget ? `（预算范围：${params.budget}）` : ''
      return `${contact} 您好：

冒昧致函，望海涵。

近期我们了解到${company}正在寻求业务优化方案${budget}。我们的产品在市场上已服务超过 500 家企业客户，积累了丰富的行业经验。

以下是我们方案的核心亮点：

【产品优势】
✓ 模块化设计，灵活适配现有系统
✓ AI 智能驱动，数据决策更加精准
✓ 安全合规，通过多项行业认证

【服务承诺】
→ 免费前期咨询与需求调研
→ 成功案例现场考察
→ 不满意全额退款保障

我们可以安排 30 分钟的线上演示，为您详细展示方案如何解决实际业务痛点。请问下周哪个时间段比较方便？

如有任何疑问，随时与我联系。

祝商祺！

XXX
高级销售顾问
手机：139-XXXX-XXXX
微信：同手机号`
    },
    (params: any) => {
      const company = params.companyName || '贵司'
      const contact = params.contactPerson || '老师'
      const timeline = params.timeline ? `（预计时间：${params.timeline}）` : ''
      const industry = params.industry || ''
      return `${contact}：

您好！${industry ? `得知${company}是${industry}领域的标杆企业，` : ''}非常敬佩贵司的专业能力。

我们诚挚邀请${company}体验我们最新升级的智能解决方案${timeline}。该方案的独特价值在于：

★ 独家专利技术，行业领先
★ 快速部署，最短 7 天即可上线
★ 投资回报周期平均仅 3 个月

具体价值体现在：

1. 【降本】自动化流程替代人工，节约人力成本
2. 【增效】全链路数据打通，决策效率提升 50%
3. 【增长】智能推荐引擎，助力客户转化提升

附件是相关案例资料，方便时可以查阅。如需要详细的方案介绍，我可以随时上门拜访。

感谢您的宝贵时间，期待您的回复！

顺颂商安

XXX
销售总监 | XX科技
📞 137-XXXX-XXXX
📧 xxx@xxtech.com`
    },
  ]

  private generateSubject(params: any): string {
    const company = params.companyName || '贵公司'
    const subjects = [
      `关于助力${company}业务增长的合作方案`,
      `${company}专属 - 智能化解决方案建议书`,
      `行业洞察分享 | 为${company}量身定制的优化方案`,
      `期待与${company}携手，共创价值`,
    ]
    return subjects[Math.floor(Math.random() * subjects.length)]
  }

  async chat(systemPrompt: string, userPrompt: string, options?: LLMChatOptions): Promise<LLMResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 800))

    let params: any = {}
    try {
      const jsonMatch = userPrompt.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        params = JSON.parse(jsonMatch[0])
      }
    } catch {
      params = {}
    }

    const template = this.emailTemplates[Math.floor(Math.random() * this.emailTemplates.length)]
    const body = template(params)
    const subject = this.generateSubject(params)
    const content = JSON.stringify({ subject, body })

    const modelName = options?.model || 'mock-model'
    const { promptTokens, completionTokens, totalTokens } = generateRandomTokens(
      systemPrompt.length / 4 + userPrompt.length / 4,
      systemPrompt.length / 2 + userPrompt.length / 2,
      body.length / 4,
      body.length / 2,
    )
    const costUsd = round(calculateCost(promptTokens, completionTokens, modelName), 6)

    return {
      content,
      promptTokens,
      completionTokens,
      totalTokens,
      costUsd,
      modelName,
      finishReason: 'stop',
    }
  }
}

export const llmAdapter: LLMAdapter = MockLLM.getInstance()

export default llmAdapter
