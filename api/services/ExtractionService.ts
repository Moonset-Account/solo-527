import OpenAI from 'openai';
import { db, uuidv4, mapModelVersion, mapActionItem } from '../db/database.js';
import type {
  ActionItem,
  TranscriptSegment,
  FieldConfidence,
  EvidenceSpan,
  FieldName,
  ConfidenceLevel,
  ModelVersion,
  DbModelVersionRow,
  DbActionItemRow,
} from '#shared/types';

const SYSTEM_PROMPT_ZH = `你是一个专业的会议纪要行动项抽取专家。你的任务是从会议转写文本中精准抽取结构化行动项。

## 抽取字段要求
必须为每个行动项抽取以下 6 个字段，每个字段都要有置信度(0-1)和判断理由：

1. **content** (string)：行动项的完整描述，必须具体可执行
2. **assignee** (string | null)：负责人的姓名或唯一标识。若无法从文本中明确确定负责人，**必须填 null**，并标记 assigneeStatus 为 pending_assignment，**绝不允许凭空猜测！**
3. **dueDate** (string | null)：截止日期 ISO 格式 (YYYY-MM-DD)。若未提及日期或模糊不清，填 null
4. **topic** (string | null)：行动项所属议题或主题，无则填 null
5. **priority** (P0|P1|P2|P3)：
   - P0：紧急且重要，阻塞项目
   - P1：重要，近期必须完成
   - P2：常规优先级
   - P3：可延期
6. **milestone** (string | null)：所属里程碑名称或 ID，未提及则填 null

## 证据链要求
每个字段必须提供证据链 evidence，包含：
- **segmentId**：对应转写段落的 ID
- **startChar**：段内起始字符偏移
- **endChar**：段内结束字符偏移
- **quotedText**：引用的原文片段（脱敏后）

## 严格规则
1. 负责人不确定 → 必须为 null 且 assigneeStatus=pending_assignment，**绝对不能凭空猜测或编造人名**
2. 缺失字段 → 值填 null，并写入 missingFields 数组
3. 置信度 < 0.6 的字段 → 写入 lowConfidenceFields 数组，并在 reason 中说明原因
4. 每个行动项必须能在转写中找到证据支持，无证据的不抽取
5. 时间推理：若提到「下周五」等相对日期，需基于会议日期换算；完全不确定则填 null

## 置信度判定
- confidence >= 0.8 → high
- 0.6 <= confidence < 0.8 → medium
- confidence < 0.6 → low

## 输出格式（严格 JSON）
请严格返回 JSON 对象，结构为：
{
  "actionItems": [
    {
      "content": "...",
      "contentConfidence": {"confidence": 0.95, "reason": "明确表述..."},
      "assignee": null,
      "assigneeConfidence": {"confidence": 0.0, "reason": "未明确指定负责人"},
      "assigneeStatus": "pending_assignment",
      "dueDate": null,
      "dueDateConfidence": {"confidence": 0.0, "reason": "未提及截止日期"},
      "topic": null,
      "topicConfidence": {"confidence": 0.0, "reason": ""},
      "priority": "P2",
      "priorityConfidence": {"confidence": 0.7, "reason": "常规任务..."},
      "milestone": null,
      "milestoneConfidence": {"confidence": 0.0, "reason": ""},
      "evidence": [
        {"segmentId": "seg_xxx", "startChar": 10, "endChar": 45, "quotedText": "张三负责完成登录模块"}
      ],
      "missingFields": ["assignee", "dueDate"],
      "lowConfidenceFields": []
    }
  ]
}`;

interface ExtractedField {
  confidence: number;
  reason: string;
}

interface ExtractedActionItem {
  content: string;
  contentConfidence: ExtractedField;
  assignee: string | null;
  assigneeConfidence: ExtractedField;
  assigneeStatus: ActionItem['assigneeStatus'];
  dueDate: string | null;
  dueDateConfidence: ExtractedField;
  topic: string | null;
  topicConfidence: ExtractedField;
  priority: ActionItem['priority'];
  priorityConfidence: ExtractedField;
  milestone: string | null;
  milestoneConfidence: ExtractedField;
  evidence: EvidenceSpan[];
  missingFields: string[];
  lowConfidenceFields: string[];
}

interface ExtractionResponse {
  actionItems: ExtractedActionItem[];
}

function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 0.8) return 'high';
  if (c >= 0.6) return 'medium';
  if (c > 0) return 'low';
  return 'unknown';
}

function buildFieldConfidences(extracted: ExtractedActionItem): FieldConfidence[] {
  const fields: Array<{ name: FieldName; value: ExtractedField }> = [
    { name: 'content', value: extracted.contentConfidence },
    { name: 'assignee', value: extracted.assigneeConfidence },
    { name: 'dueDate', value: extracted.dueDateConfidence },
    { name: 'topic', value: extracted.topicConfidence },
    { name: 'priority', value: extracted.priorityConfidence },
    { name: 'milestone', value: extracted.milestoneConfidence },
  ];

  return fields.map(({ name, value }) => ({
    field: name,
    confidence: value.confidence,
    level: confidenceLevel(value.confidence),
    reason: value.reason,
  }));
}

export class ExtractionService {
  getActiveModel(): ModelVersion {
    const row = db.prepare('SELECT * FROM model_versions WHERE is_active = 1 LIMIT 1').get() as DbModelVersionRow | undefined;
    if (row) return mapModelVersion(row);

    const fallback: ModelVersion = {
      id: 'mv_default',
      name: 'gpt-4o-mini 默认版',
      baseModel: 'gpt-4o-mini',
      status: 'ready',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    return fallback;
  }

  private mockExtract(segments: TranscriptSegment[]): ExtractedActionItem[] {
    const results: ExtractedActionItem[] = [];
    const fullText = segments.map((s) => s.text).join('\n');

    const actionKeywords = ['负责', '完成', '跟进', '处理', '提交', '发布', '编写', '设计', '安排', '确认'];
    const priorityKeywordsP0 = ['紧急', '马上', '立刻', '阻塞', '必须今天', '立即'];
    const priorityKeywordsP1 = ['本周', '这周', '近期', '尽快', '这周内'];
    const datePatterns: Array<{ regex: RegExp; offsetDays?: (d: Date) => number }> = [
      { regex: /(\d{4})[-\/年](\d{1,2})[-\/月](\d{1,2})/ },
      { regex: /明天/, offsetDays: (d) => 1 },
      { regex: /后天/, offsetDays: (d) => 2 },
      { regex: /下周[一二三四五六日]?/, offsetDays: (d) => 7 },
    ];

    const dueDateMatch = (() => {
      const isoMatch = fullText.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
      if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
      return null;
    })();

    const milestoneMatch = fullText.match(/(里程碑|Milestone)[\s：:]*([^\s，,。.；;]{2,20})/);
    const milestone = milestoneMatch ? milestoneMatch[2] : null;

    for (const seg of segments) {
      for (const kw of actionKeywords) {
        const idx = seg.text.indexOf(kw);
        if (idx === -1) continue;

        const startChar = Math.max(0, idx - 20);
        const endChar = Math.min(seg.text.length, idx + 30);
        const quotedText = seg.text.slice(startChar, endChar);

        let priority: ActionItem['priority'] = 'P2';
        let priConf = 0.65;
        let priReason = '基于关键词推断的常规优先级';
        if (priorityKeywordsP0.some((p) => seg.text.includes(p))) {
          priority = 'P0';
          priConf = 0.85;
          priReason = '出现紧急相关关键词';
        } else if (priorityKeywordsP1.some((p) => seg.text.includes(p))) {
          priority = 'P1';
          priConf = 0.72;
          priReason = '出现本周/近期相关关键词';
        }

        const assigneeMatch = seg.text.match(/([\u4e00-\u9fa5]{2,4})(?:同学|老师|经理|负责|来做|跟进)/);
        let assignee: string | null = null;
        let assigneeConf = 0;
        let assigneeReason = '未明确指定负责人';
        let assigneeStatus: ActionItem['assigneeStatus'] = 'pending_assignment';
        if (assigneeMatch) {
          assignee = assigneeMatch[1];
          assigneeConf = 0.7;
          assigneeReason = '基于人物称呼匹配';
          assigneeStatus = 'ai_suggested';
        }

        const missingFields: string[] = [];
        const lowConfidenceFields: string[] = [];

        if (!dueDateMatch) missingFields.push('dueDate');
        if (!assignee) missingFields.push('assignee');
        if (!milestone) missingFields.push('milestone');

        if (assigneeConf < 0.6) lowConfidenceFields.push('assignee');
        if (dueDateMatch == null) {
          // missing already
        }

        results.push({
          content: quotedText,
          contentConfidence: { confidence: 0.82, reason: `包含动作关键词「${kw}」` },
          assignee,
          assigneeConfidence: { confidence: assigneeConf, reason: assigneeReason },
          assigneeStatus,
          dueDate: dueDateMatch,
          dueDateConfidence: dueDateMatch ? { confidence: 0.8, reason: '匹配到明确日期格式' } : { confidence: 0, reason: '未提及具体截止日期' },
          topic: null,
          topicConfidence: { confidence: 0, reason: '' },
          priority,
          priorityConfidence: { confidence: priConf, reason: priReason },
          milestone,
          milestoneConfidence: milestone ? { confidence: 0.6, reason: '匹配到里程碑关键词' } : { confidence: 0, reason: '' },
          evidence: [
            {
              segmentId: seg.id,
              startChar,
              endChar,
              quotedText,
            },
          ],
          missingFields,
          lowConfidenceFields,
        });
        break;
      }
    }

    return results.slice(0, 8);
  }

  private async openAIExtract(
    model: ModelVersion,
    segments: TranscriptSegment[],
  ): Promise<{ data: ExtractedActionItem[]; promptTokens: number; completionTokens: number }> {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey || apiKey === 'demo') {
      return { data: this.mockExtract(segments), promptTokens: 0, completionTokens: 0 };
    }

    const client = new OpenAI({ apiKey });
    const transcriptText = segments.map((s) => `[${s.id}] ${s.text}`).join('\n\n');
    const modelName = model.openaiFinetuneId || model.baseModel;

    const resp = await client.chat.completions.create({
      model: modelName,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_ZH },
        { role: 'user', content: `## 会议转写文本\n\n${transcriptText}\n\n请抽取行动项。` },
      ],
    });

    const content = resp.choices[0]?.message?.content ?? '{"actionItems":[]}';
    let parsed: ExtractionResponse;
    try {
      parsed = JSON.parse(content) as ExtractionResponse;
    } catch {
      parsed = { actionItems: [] };
    }

    return {
      data: parsed.actionItems || [],
      promptTokens: resp.usage?.prompt_tokens ?? 0,
      completionTokens: resp.usage?.completion_tokens ?? 0,
    };
  }

  async extractActionItems(
    meetingId: string,
    segments: TranscriptSegment[],
    userId: string,
  ): Promise<{ items: ActionItem[]; promptTokens: number; completionTokens: number; modelName: string }> {
    const model = this.getActiveModel();
    const modelName = model.openaiFinetuneId || model.baseModel || model.name;
    const now = new Date().toISOString();

    let extracted: ExtractedActionItem[];
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const result = await this.openAIExtract(model, segments);
      extracted = result.data;
      promptTokens = result.promptTokens;
      completionTokens = result.completionTokens;
    } catch {
      extracted = this.mockExtract(segments);
    }

    const items: ActionItem[] = [];
    const insertItem = db.prepare(`
      INSERT INTO action_items (
        id, meeting_id, content, assignee, assignee_status, due_date, topic, milestone_id,
        priority, status, field_confidences_json, evidence_json, model_version,
        missing_fields_json, low_confidence_fields_json, remarks, version,
        updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const ext of extracted) {
        const fieldConfidences = buildFieldConfidences(ext);
        const item: ActionItem = {
          id: uuidv4(),
          meetingId,
          content: ext.content,
          assignee: ext.assignee,
          assigneeStatus: ext.assigneeStatus,
          dueDate: ext.dueDate,
          topic: ext.topic,
          milestoneId: ext.milestone,
          priority: ext.priority,
          status: 'draft',
          fieldConfidences,
          evidence: ext.evidence,
          modelVersion: modelName,
          missingFields: ext.missingFields,
          lowConfidenceFields: ext.lowConfidenceFields,
          remarks: '',
          version: 1,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        };

        insertItem.run(
          item.id,
          item.meetingId,
          item.content,
          item.assignee,
          item.assigneeStatus,
          item.dueDate,
          item.topic,
          item.milestoneId,
          item.priority,
          item.status,
          JSON.stringify(item.fieldConfidences),
          JSON.stringify(item.evidence),
          item.modelVersion,
          JSON.stringify(item.missingFields),
          JSON.stringify(item.lowConfidenceFields),
          item.remarks,
          item.version,
          item.updatedBy,
          item.createdAt,
          item.updatedAt,
        );

        items.push(item);
      }
    });

    tx();

    return { items, promptTokens, completionTokens, modelName };
  }

  getByMeeting(meetingId: string): ActionItem[] {
    const rows = db
      .prepare('SELECT * FROM action_items WHERE meeting_id = ? ORDER BY created_at')
      .all(meetingId) as unknown[];
    return rows.map((r) => mapActionItem(r as DbActionItemRow));
  }
}

export default new ExtractionService();
