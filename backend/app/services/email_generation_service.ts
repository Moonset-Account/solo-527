import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import EmailDraft from '#models/email_draft'
import CitedSource from '#models/cited_source'
import CostRecord from '#models/cost_record'
import SpeechTemplateVersion from '#models/speech_template_version'
import PromptVersion from '#models/prompt_version'
import KnowledgeRetrievalService from '#services/knowledge_retrieval_service'
import llmAdapter from '../adapters/llm_adapter.js'
import { usdToCents, round } from '../utils/helpers.js'
import type { LLMResponse } from '../adapters/llm_adapter.js'
import type { WeightedItem } from '../utils/helpers.js'
import { grayScaleSelect } from '../utils/helpers.js'
import { BusinessException } from '#exceptions/handler'

interface CustomerBackground {
  companyName?: string
  industry?: string
  contactPerson?: string
  painPoints?: string
  budget?: string
  timeline?: string
  additionalInfo?: string
}

interface GenerateParams {
  customerBackground: CustomerBackground
  templateId?: number
  userId: number
  recipientEmail?: string
  recipientName?: string
}

interface GenerateResult {
  draft: EmailDraft
  citedSources: CitedSource[]
  cost: CostRecord
}

interface TemplateVersionWithWeight extends WeightedItem {
  id: number
  version: string
  content: string
  speechTemplateId: number
  weight: number
}

interface PromptVersionWithWeight extends WeightedItem {
  id: number
  version: string
  systemPrompt: string
  userPromptTemplate: string | null
  parameters: Record<string, any>
  weight: number
}

export default class EmailGenerationService {
  private static instance: EmailGenerationService

  static getInstance(): EmailGenerationService {
    if (!EmailGenerationService.instance) {
      EmailGenerationService.instance = new EmailGenerationService()
    }
    return EmailGenerationService.instance
  }

  async generate(params: GenerateParams): Promise<GenerateResult> {
    const trx = await db.transaction()

    try {
      const { customerBackground, templateId, userId, recipientEmail, recipientName } = params

      const templateVersion = await this.selectTemplateVersion(templateId)
      const promptVersion = await this.selectPromptVersion()

      const searchQuery = this.buildSearchQuery(customerBackground)
      const knowledgeResults = await KnowledgeRetrievalService.search(searchQuery, 5)

      const systemPrompt = this.buildSystemPrompt(promptVersion, templateVersion, knowledgeResults)
      const userPrompt = this.buildUserPrompt(customerBackground, templateVersion, knowledgeResults)

      const llmOptions = {
        model: promptVersion.parameters?.model || 'mock-model',
        temperature: promptVersion.parameters?.temperature || 0.7,
        maxTokens: promptVersion.parameters?.maxTokens || 2048,
      }

      const llmResponse: LLMResponse = await llmAdapter.chat(systemPrompt, userPrompt, llmOptions)

      let parsedContent: { subject?: string; body?: string } = {}
      try {
        parsedContent = JSON.parse(llmResponse.content)
      } catch {
        parsedContent = {
          subject: `关于合作方案的邮件 - ${customerBackground.companyName || '贵公司'}`,
          body: llmResponse.content,
        }
      }

      const costUsd = round(llmResponse.costUsd, 6)
      const costCents = usdToCents(costUsd)

      const draft = await EmailDraft.create(
        {
          subject: parsedContent.subject || '未命名邮件',
          body: parsedContent.body || '',
          recipientEmail: recipientEmail || null,
          recipientName: recipientName || null,
          customerBackground: customerBackground as Record<string, any>,
          citedSources: knowledgeResults.map((k) => ({
            id: k.id,
            title: k.title,
            score: k.similarityScore,
          })),
          status: 'draft',
          riskLevel: this.assessRisk(parsedContent.body || ''),
          riskNotes: null,
          salesId: userId,
          opsId: null,
          promptVersionId: promptVersion.id,
          speechTemplateVersionId: templateVersion.id,
          generationCost: costUsd,
          reviewCount: 0,
          rejectReasonId: null,
          rejectDetail: null,
          submittedAt: null,
          approvedAt: null,
          rejectedAt: null,
          sentAt: null,
        },
        { client: trx },
      )

      const citedSourcePromises = knowledgeResults.map((result) =>
        CitedSource.create(
          {
            emailDraftId: draft.id,
            knowledgeItemId: result.id,
            sourceTitle: result.title,
            sourceContent: result.content.substring(0, 500),
            relevanceScore: result.similarityScore,
            createdBy: userId,
          },
          { client: trx },
        ),
      )
      const citedSources = await Promise.all(citedSourcePromises)

      const cost = await CostRecord.create(
        {
          userId,
          emailDraftId: draft.id,
          costType: 'generation',
          promptTokens: llmResponse.promptTokens,
          completionTokens: llmResponse.completionTokens,
          totalTokens: llmResponse.totalTokens,
          costUsd,
          costCents,
          modelName: llmResponse.modelName,
          metadata: {
            templateVersionId: templateVersion.id,
            templateVersion: templateVersion.version,
            promptVersionId: promptVersion.id,
            promptVersion: promptVersion.version,
            knowledgeCount: knowledgeResults.length,
          },
        },
        { client: trx },
      )

      await trx.commit()

      return {
        draft,
        citedSources,
        cost,
      }
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  private async selectTemplateVersion(templateId?: number): Promise<TemplateVersionWithWeight> {
    let query = SpeechTemplateVersion.query()

    if (templateId) {
      query = query.where('speechTemplateId', templateId)
    }

    const versions = await query
      .where((builder) => {
        builder.where('isCurrent', true).orWhereHas('speechTemplate', (tplQuery) => {
          tplQuery.whereNull('deletedAt')
        })
      })
      .select('id', 'speechTemplateId', 'version', 'content')
      .exec()

    if (versions.length === 0) {
      return {
        id: 0,
        speechTemplateId: 0,
        version: 'default',
        content: '标准商务邮件模板，需包含称呼、正文、结尾签名等部分。',
        weight: 1,
      }
    }

    const weightedVersions: TemplateVersionWithWeight[] = versions.map((v, index) => ({
      id: v.id,
      speechTemplateId: v.speechTemplateId,
      version: v.version,
      content: v.content,
      weight: v.$attributes.isCurrent ? 70 : 30 / Math.max(1, versions.length - 1),
    }))

    return grayScaleSelect(weightedVersions) || weightedVersions[0]
  }

  private async selectPromptVersion(): Promise<PromptVersionWithWeight> {
    const activePrompts = await PromptVersion.query()
      .where('isActive', true)
      .whereNull('deletedAt')
      .select('id', 'version', 'systemPrompt', 'userPromptTemplate', 'parameters')
      .exec()

    if (activePrompts.length === 0) {
      return {
        id: 0,
        version: 'default',
        systemPrompt:
          '你是一名专业的B2B销售邮件撰写专家。请根据提供的客户背景信息、话术模板和知识库参考资料，撰写一封专业、有说服力的商务开发邮件。要求：1. 语气专业但不生硬；2. 结构清晰，重点突出；3. 体现对客户行业的了解；4. 结尾要有明确的行动号召。请以JSON格式输出，包含subject和body两个字段。',
        userPromptTemplate: null,
        parameters: {},
        weight: 1,
      }
    }

    const weightedPrompts: PromptVersionWithWeight[] = activePrompts.map((p, index) => ({
      id: p.id,
      version: p.version,
      systemPrompt: p.systemPrompt,
      userPromptTemplate: p.userPromptTemplate,
      parameters: p.parameters || {},
      weight: index === 0 ? 60 : 40 / Math.max(1, activePrompts.length - 1),
    }))

    return grayScaleSelect(weightedPrompts) || weightedPrompts[0]
  }

  private buildSearchQuery(bg: CustomerBackground): string {
    const parts: string[] = []
    if (bg.industry) parts.push(bg.industry)
    if (bg.painPoints) parts.push(bg.painPoints)
    if (bg.companyName) parts.push(bg.companyName)
    if (bg.additionalInfo) parts.push(bg.additionalInfo)
    return parts.join(' ') || '商务合作 销售方案'
  }

  private buildSystemPrompt(
    promptVersion: PromptVersionWithWeight,
    templateVersion: TemplateVersionWithWeight,
    knowledgeResults: any[],
  ): string {
    let systemPrompt = promptVersion.systemPrompt

    systemPrompt += '\n\n【话术模板参考】\n' + templateVersion.content

    if (knowledgeResults.length > 0) {
      systemPrompt += '\n\n【知识库参考资料】\n'
      knowledgeResults.forEach((k, idx) => {
        systemPrompt += `\n[资料${idx + 1}] 标题: ${k.title}\n内容: ${k.content.substring(0, 300)}\n相似度: ${k.similarityScore}\n`
      })
    }

    systemPrompt += '\n\n【重要要求】\n请严格按照JSON格式返回，不要添加额外的说明文字。JSON格式示例：{"subject": "邮件主题", "body": "邮件正文"}'

    return systemPrompt
  }

  private buildUserPrompt(
    bg: CustomerBackground,
    templateVersion: TemplateVersionWithWeight,
    knowledgeResults: any[],
  ): string {
    return `
请根据以下客户背景信息撰写邮件：

【客户背景】
${JSON.stringify(bg, null, 2)}

【使用的话术模板版本】${templateVersion.version}

【已检索到的知识库条目数量】${knowledgeResults.length}

请撰写一封专业的商务邮件，确保内容贴合客户的实际情况，引用知识库中的相关资料，并按照话术模板的结构组织内容。
`
  }

  private assessRisk(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerContent = content.toLowerCase()

    const criticalKeywords = ['承诺', '保证', '独家', '最', '第一', '违法', '违规', '保密']
    const highKeywords = ['折扣', '优惠', '特价', '合同', '法律', '价格', '报价']
    const mediumKeywords = ['免费', '试用', '演示', '案例', '数据']

    let criticalCount = 0
    let highCount = 0
    let mediumCount = 0

    for (const kw of criticalKeywords) {
      if (lowerContent.includes(kw)) criticalCount++
    }
    for (const kw of highKeywords) {
      if (lowerContent.includes(kw)) highCount++
    }
    for (const kw of mediumKeywords) {
      if (lowerContent.includes(kw)) mediumCount++
    }

    if (criticalCount >= 2) return 'critical'
    if (criticalCount >= 1 || highCount >= 3) return 'high'
    if (highCount >= 1 || mediumCount >= 3) return 'medium'
    return 'low'
  }

  async getDraftWithDetails(id: number, userId?: number, userRole?: string): Promise<EmailDraft> {
    const query = EmailDraft.query()
      .where('id', id)
      .preload('citedSourceRelations')
      .preload('speechTemplateVersion')
      .preload('promptVersion')
      .preload('sales', (q) => q.select('id', 'username', 'fullName', 'email', 'role'))
      .preload('ops', (q) => q.select('id', 'username', 'fullName', 'email', 'role'))
      .preload('rejectReason')
      .preload('reviewRecords', (q) => {
        q.preload('reviewer', (rq) => rq.select('id', 'username', 'fullName')).orderBy('createdAt', 'desc')
      })

    const draft = await query.first()

    if (!draft) {
      throw new BusinessException('邮件草稿不存在', 4004, 404)
    }

    if (userRole === 'sales' && userId && draft.salesId !== userId) {
      throw new BusinessException('无权查看此邮件草稿', 4003, 403)
    }

    return draft
  }

  async submitReview(id: number, userId: number, note?: string): Promise<EmailDraft> {
    const draft = await EmailDraft.find(id)

    if (!draft) {
      throw new BusinessException('邮件草稿不存在', 4004, 404)
    }

    if (draft.salesId !== userId) {
      throw new BusinessException('只能提交自己创建的邮件草稿', 4003, 403)
    }

    if (draft.status !== 'draft') {
      throw new BusinessException('当前状态不允许提交复核', 4000)
    }

    draft.status = 'reviewing'
    draft.submittedAt = DateTime.now()
    if (note) {
      draft.riskNotes = note
    }
    await draft.save()

    return draft.refresh()
  }

  async updateDraft(
    id: number,
    userId: number,
    updates: {
      subject?: string
      body?: string
      recipientEmail?: string
      recipientName?: string
    }
  ): Promise<EmailDraft> {
    const draft = await EmailDraft.find(id)

    if (!draft) {
      throw new BusinessException('邮件草稿不存在', 4004, 404)
    }

    if (draft.salesId !== userId) {
      throw new BusinessException('只能修改自己创建的邮件草稿', 4003, 403)
    }

    if (draft.status !== 'draft') {
      throw new BusinessException('当前状态不允许编辑，请先撤回或新建草稿', 4000)
    }

    if (updates.subject !== undefined) draft.subject = updates.subject
    if (updates.body !== undefined) {
      draft.body = updates.body
      draft.riskLevel = this.assessRisk(updates.body)
    }
    if (updates.recipientEmail !== undefined) draft.recipientEmail = updates.recipientEmail
    if (updates.recipientName !== undefined) draft.recipientName = updates.recipientName

    await draft.save()
    return draft.refresh()
  }

  async listDrafts(
    params: {
      page?: number
      perPage?: number
      status?: string
      keyword?: string
      startDate?: string
      endDate?: string
    },
    userId?: number,
    userRole?: string,
  ) {
    const page = params.page || 1
    const perPage = params.perPage || 20

    const query = EmailDraft.query()
      .whereNull('deletedAt')
      .preload('sales', (q) => q.select('id', 'username', 'fullName'))
      .preload('rejectReason')
      .orderBy('createdAt', 'desc')

    if (userRole === 'sales' && userId) {
      query.where('salesId', userId)
    }

    if (params.status) {
      query.where('status', params.status)
    }

    if (params.keyword) {
      query.where((builder) => {
        builder.whereILike('subject', `%${params.keyword}%`).orWhereILike('body', `%${params.keyword}%`)
      })
    }

    if (params.startDate) {
      query.where('createdAt', '>=', DateTime.fromFormat(params.startDate, 'yyyy-MM-dd').startOf('day').toISO())
    }
    if (params.endDate) {
      query.where('createdAt', '<=', DateTime.fromFormat(params.endDate, 'yyyy-MM-dd').endOf('day').toISO())
    }

    return query.paginate(page, perPage)
  }
}
