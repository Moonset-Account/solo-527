/**
 * OpenAI 行动项抽取服务
 *
 * 核心设计原则：
 * 1. 谨慎模式：模型不得凭空编造负责人/截止日期/里程碑
 * 2. 置信度评估：对每个关键字段给出 0-1 的置信度
 * 3. 低于阈值的字段标记为待确认，并注明原因和复核建议
 * 4. 输出结构化 JSON，便于下游处理
 */
const OpenAI = require('openai');
const config = require('../config');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

let client;

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: config.openai.apiKey });
  }
  return client;
}

const EXTRACTION_SYSTEM_PROMPT = `你是一名专业的会议纪要分析专家，擅长从会议转写中提取行动项。

## 核心原则（务必严格遵守）

### 1. 谨慎原则 - 不编造任何信息
- 如果没有明确提到负责人（人名或角色），**绝不能**自己推测或填充
- 如果没有明确的截止日期（具体日期、或明确的"下周五"、"3天内"等相对日期），**绝不能**推测
- 如果没有明确声明是里程碑或关键节点，**绝不能**标记为里程碑

### 2. 置信度标注
对每个关键字段给出 0.0 到 1.0 的置信度评分：
- 0.95 - 1.00: 原文明确、直接、无歧义
- 0.80 - 0.94: 较明确，但需要少量常识推理
- 0.60 - 0.79: 有一定依据，但存在歧义
- 0.00 - 0.59: 信息不充分或高度不确定

### 3. 待确认标记
- 当负责人置信度 < 0.75 时，assignee_pending = true，assignee_note 说明不确定的原因
- 当截止日期置信度 < 0.70 时，deadline_pending = true，deadline_note 说明原因
- 当里程碑置信度 < 0.80 时，is_milestone = false，milestone_note 说明原因
- needs_review: 如果任何字段需要确认，或行动项本身存在歧义，标记为 true，并在 review_reason 中列出所有需复核点

### 4. 待确认原因示例
- assignee_note: "原文只说'相关同事跟进'，未明确具体人员"
- deadline_note: "原文提到'尽快完成'，无具体时间节点"
- milestone_note: "该任务为普通开发任务，未在会议中被标记为里程碑"
- review_reason: "1. 负责人待确认；2. 截止日期不明确；3. 任务边界存在歧义"

## 输出格式（严格 JSON）

\`\`\`json
{
  "topics": [
    {
      "title": "议题标题",
      "description": "议题描述（可选）",
      "start_segment_index": 0,
      "end_segment_index": 5
    }
  ],
  "action_items": [
    {
      "title": "简明的行动项标题",
      "description": "详细描述（可选）",
      "assignee": "张三",
      "assignee_confidence": 0.98,
      "assignee_pending": false,
      "assignee_note": null,
      "deadline": "2026-06-15",
      "deadline_confidence": 0.85,
      "deadline_pending": false,
      "deadline_note": null,
      "priority": "high|medium|low",
      "is_milestone": false,
      "milestone_confidence": 0.3,
      "milestone_note": "未明确为里程碑",
      "project_name": "XX项目",
      "related_segment_index": 3,
      "needs_review": false,
      "review_reason": null
    }
  ],
  "speakers": [
    { "raw_alias": "发言人1", "normalized_name": "张三", "role_hint": "产品经理" }
  ],
  "warnings": ["整体警告信息（可选）"]
}
\`\`\`

## 补充说明
- 日期请统一转换为 ISO 格式 YYYY-MM-DD
- 如果今天是 2026-06-09，则"下周五" = 2026-06-19，"3天内" = 2026-06-12
- 中文人名、英文人名、明确的角色（如"项目经理"）都可作为 assignee，但"有人"、"大家"、"相关人员"等模糊表述必须标记待确认
- milestone 仅用于被会议明确识别为"关键交付"、"里程碑节点"、"版本发布"等重大事项
- 不要漏掉任何行动项，哪怕很小的任务`;

function buildUserPrompt(context) {
  const { meetingTitle = '', projectName = '', meetingDate = '', segments = [] } = context;
  const lines = [
    `# 会议元数据`,
    `- 会议标题: ${meetingTitle || '(未提供)'}`,
    `- 项目名称: ${projectName || '(未提供)'}`,
    `- 会议日期: ${meetingDate || new Date().toISOString().slice(0, 10)}`,
    ``,
    `# 会议转写（按顺序）`,
  ];

  segments.forEach((seg, i) => {
    const speaker = seg.speaker ? `[${seg.speaker}]` : '';
    const time = seg.start_time !== null && seg.end_time !== null
      ? `(${_formatTime(seg.start_time)}-${_formatTime(seg.end_time)})`
      : '';
    lines.push(`## ${i} ${time} ${speaker}`);
    lines.push(seg.content || '(空)');
    lines.push('');
  });

  return lines.join('\n');
}

function _formatTime(secs) {
  if (secs === null || secs === undefined) return '';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

async function extractActionItems(ctx, opts = {}) {
  const start = Date.now();
  const { useModel = config.openai.model } = opts;
  const userPrompt = buildUserPrompt(ctx);

  logger.info(`[extract] Calling OpenAI ${useModel}, prompt length: ${userPrompt.length}`);

  const openai = getClient();
  const resp = await openai.chat.completions.create({
    model: useModel,
    temperature: config.openai.temperature,
    max_tokens: config.openai.maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  });

  const rawContent = resp.choices[0].message.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    logger.error('[extract] Failed to parse model JSON', { error: e.message, raw: rawContent.slice(0, 500) });
    throw new Error(`模型输出 JSON 解析失败: ${e.message}`);
  }

  const result = _applyThresholds(parsed);
  result._meta = {
    model: resp.model || useModel,
    tokens: resp.usage || {},
    latencyMs: Date.now() - start,
    rawResponse: rawContent,
  };
  return result;
}

function _applyThresholds(result) {
  const items = (result.action_items || []).map(item => {
    const out = { ...item };

    if (!out.assignee || out.assignee_confidence === undefined) {
      out.assignee = null;
      out.assignee_confidence = 0;
      out.assignee_pending = 1;
      out.assignee_note = out.assignee_note || '原文未提及明确负责人';
    } else if (out.assignee_confidence < config.thresholds.assignee) {
      out.assignee_pending = 1;
      out.assignee_note = out.assignee_note || `负责人置信度 ${out.assignee_confidence.toFixed(2)} 低于阈值 ${config.thresholds.assignee}`;
    } else {
      out.assignee_pending = 0;
    }

    if (!out.deadline || out.deadline_confidence === undefined) {
      out.deadline = null;
      out.deadline_confidence = 0;
      out.deadline_pending = 1;
      out.deadline_note = out.deadline_note || '原文未提及明确截止日期';
    } else if (out.deadline_confidence < config.thresholds.deadline) {
      out.deadline_pending = 1;
      out.deadline_note = out.deadline_note || `截止日期置信度 ${out.deadline_confidence.toFixed(2)} 低于阈值 ${config.thresholds.deadline}`;
    } else {
      out.deadline_pending = 0;
    }

    if (out.is_milestone === true) {
      if (!out.milestone_confidence || out.milestone_confidence < config.thresholds.milestone) {
        out.is_milestone = 0;
        out.milestone_note = out.milestone_note || `里程碑置信度不足，已降级为普通行动项`;
      } else {
        out.is_milestone = 1;
      }
    } else {
      out.is_milestone = 0;
      if (!out.milestone_note) out.milestone_note = '未在会议中被标记为里程碑';
    }

    const reviewReasons = [];
    if (out.assignee_pending) reviewReasons.push(`负责人待确认: ${out.assignee_note}`);
    if (out.deadline_pending) reviewReasons.push(`截止日期待确认: ${out.deadline_note}`);
    if (!out.title || out.title.length < 2) reviewReasons.push('行动项标题不完整');
    out.needs_review = reviewReasons.length > 0 ? 1 : 0;
    out.review_reason = reviewReasons.length > 0 ? reviewReasons.join('；') : null;

    if (!out.priority || !['high', 'medium', 'low'].includes(out.priority)) {
      out.priority = 'medium';
    }

    return out;
  });

  return {
    topics: (result.topics || []).map(t => ({
      title: t.title || '未命名议题',
      description: t.description || null,
      start_segment_index: t.start_segment_index ?? null,
      end_segment_index: t.end_segment_index ?? null,
    })),
    action_items: items,
    speakers: (result.speakers || []).map(s => ({
      raw_alias: s.raw_alias || '',
      normalized_name: s.normalized_name || '',
      role_hint: s.role_hint || null,
    })),
    warnings: result.warnings || [],
  };
}

/**
 * 对批量样本进行验证推理
 */
async function runValidationInference(samples, opts = {}) {
  const results = [];
  for (const sample of samples) {
    try {
      const result = await extractActionItems({
        meetingTitle: sample.meeting_title,
        projectName: sample.project_name,
        meetingDate: sample.meeting_date,
        segments: sample.segments || [{ content: sample.transcript, speaker: '' }],
      }, opts);
      results.push({ sample_id: sample.id, success: true, prediction: result });
    } catch (err) {
      results.push({ sample_id: sample.id, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = {
  extractActionItems,
  runValidationInference,
  buildUserPrompt,
  EXTRACTION_SYSTEM_PROMPT,
};
