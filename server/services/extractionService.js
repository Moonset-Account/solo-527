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

/**
 * 启发式规则抽取（无 OpenAI Key 时的本地 fallback）
 * 基于：
 *   1. 发言人识别 = 行动项归属人候选
 *   2. 行动动词库 = 触发任务的关键词
 *   3. 日期/时间词 = 截止日期
 *   4. 里程碑关键词 = is_milestone
 *   5. 模糊人称词 = 标记为待确认负责人
 */
function _heuristicExtract(ctx) {
  const { meetingTitle = '', projectName = '', meetingDate = '', segments = [] } = ctx;
  const baseDate = meetingDate ? new Date(meetingDate + 'T12:00:00') : new Date();
  const today = new Date(baseDate);
  const fmt = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const d2 = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${d2}`;
  };
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return fmt(d); };

  // 所有参会人
  const speakers = segments.map(s => (s.speaker || '').trim()).filter(Boolean);
  const speakerSet = Array.from(new Set(speakers));

  // 行动触发词 + 类别
  const ACTION_PATTERNS = [
    // 强行动模式：某人 + 动词 + 任务 + 时间
    {
      pattern: /(你|您|你们|请)?\s*(完成|做|负责|跟进|处理|安排|开发|编写|测试|设计|出|准备|整理|提交|更新|修复|优化|上线|对接|沟通|提供|配合|支持|解决|输出|制定|排期|跟进|推动|落实|搭建|改造|重构|迁移|评审|验收|验证|确认|审核|部署|调研|分析)/,
      weight: 0.85,
    },
  ];

  const TASK_WORDS = ['完成', '做', '负责', '跟进', '处理', '安排', '开发', '编写', '测试', '设计', '出', '准备', '整理', '提交', '更新', '修复', '优化', '上线', '对接', '沟通', '提供', '配合', '支持', '解决', '输出', '制定', '排期', '推动', '落实', '搭建', '改造', '重构', '迁移', '评审', '验收', '验证', '确认', '审核', '部署', '调研', '分析', '修改', '调整', '汇报'];
  const MILESTONE_WORDS = ['里程碑', '版本发布', '上线', '验收', '节点', '交付', '发布', 'v1', 'v2', 'v3', '版本', 'cutoff', '截止'];
  const HIGH_PRIORITY_WORDS = ['紧急', '马上', '立刻', '今天', '当日', '务必', '必须', '核心', '关键', '阻断', 'blocker', '重要'];
  const LOW_PRIORITY_WORDS = ['有空', '稍后', '空闲', '下次', '有时间', '考虑', '调研', '可选', 'nice to have', '有空再做'];

  // 模糊人称词（标记为待确认负责人）
  const VAGUE_ASSIGNEE_WORDS = ['相关同事', '大家', '有人', '有的人', '某些人', '同事', '团队', '相关人员', '对应人员', '相关的', '看一下的人', '谁有空', '相关同学', '同学', '有人负责'];

  const actionItems = [];
  const topicMap = new Map();

  // 辅助：解析文本中的日期
  function parseDateFromText(text, segSpeaker) {
    let matched = null;
    let confidence = 0;
    let note = '';

    // 绝对日期: 6月18日 / 6月18号 / 2026-06-18
    const absDM = text.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/);
    if (absDM) {
      const m = parseInt(absDM[1]);
      const d = parseInt(absDM[2]);
      const y = today.getFullYear();
      const dt = new Date(y, m - 1, d);
      // 如果日期在当前日期30天前，可能是明年
      if (dt.getTime() < today.getTime() - 30 * 86400000) dt.setFullYear(y + 1);
      return { date: fmt(dt), confidence: 0.92, note: '' };
    }
    const absISO = text.match(/(\d{4})[-_](\d{1,2})[-_](\d{1,2})/);
    if (absISO) return { date: `${absISO[1]}-${absISO[2].padStart(2,'0')}-${absISO[3].padStart(2,'0')}`, confidence: 0.95, note: '' };

    // 相对日期
    const rels = [
      { re: /今天|今日|当天|当日/, offset: 0, c: 0.95, label: '今天' },
      { re: /明天|明日/, offset: 1, c: 0.95, label: '明天' },
      { re: /后天/, offset: 2, c: 0.95, label: '后天' },
      { re: /大后天/, offset: 3, c: 0.9, label: '大后天' },
      { re: /本周[一二三四五六日天]/, offset: null, c: 0.88, label: '本周内' },
      { re: /下周[一二三四五六日天]/, offset: null, c: 0.85, label: '下周内' },
      { re: /周[一二三四五六日天]/, offset: null, c: 0.8, label: '近期周内' },
      { re: /下\s*个?\s*周/, offset: 7, c: 0.75, label: '下周（取7天后）' },
      { re: /这?\s*周[末末]/, offset: null, c: 0.78, label: '本周末' },
      { re: /月\s*底/, offset: null, c: 0.72, label: '月底' },
      { re: /季\s*度|Q[1-4]/, offset: null, c: 0.65, label: '季度末' },
      { re: /(\d+)\s*天内?/, offset: null, c: 0.82, label: 'N天内' },
      { re: /尽快|抓紧|早点|尽早/, offset: 3, c: 0.45, label: '尽快（建议3天内）' },
      { re: /近\s*期/, offset: 7, c: 0.35, label: '近期（建议7天内）' },
      { re: /有空|空闲|闲下来/, offset: 30, c: 0.2, label: '有空（建议30天内，需确认）' },
    ];

    for (const r of rels) {
      const m = text.match(r.re);
      if (m) {
        confidence = r.c;
        note = r.label || '';
        if (r.offset !== null) {
          matched = addDays(r.offset);
        } else {
          // 更复杂的相对日期
          const weekDays = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '日': 0, '天': 0, '末': 6 };
          let targetDow = null;
          let weekShift = 0;

          if (/周[一二三四五六日天末]/.test(text)) {
            const dm = text.match(/(本周|下周|下一周|下个周)?\s*周([一二三四五六日天末])/);
            if (dm) {
              if (dm[1] && /下/.test(dm[1])) weekShift = 7;
              targetDow = weekDays[dm[2]] || null;
            }
          } else if (/月底/.test(text)) {
            const dt = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            matched = fmt(dt);
          } else if (/季度|Q[1-4]/.test(text)) {
            const qm = text.match(/Q([1-4])/);
            let targetMonth = 2;
            if (qm) targetMonth = parseInt(qm[1]) * 3 - 1;
            else targetMonth = Math.floor(today.getMonth() / 3) * 3 + 2;
            const dt = new Date(today.getFullYear(), targetMonth + 1, 0);
            matched = fmt(dt);
          } else if (m[1] && /天内?/.test(text)) {
            const days = parseInt(m[1]);
            matched = addDays(days);
          }

          if (targetDow !== null) {
            const todayDow = today.getDay();
            let diff = (targetDow - todayDow + 7) % 7;
            if (diff === 0 && weekShift === 0) diff = 7; // 本周同一天默认下周
            diff += weekShift;
            matched = addDays(diff);
          }
        }
        break;
      }
    }

    return { date: matched, confidence, note };
  }

  // 辅助：从文本 + 上下文推断负责人
  function parseAssignee(text, segSpeaker, segIdx) {
    let assignee = null;
    let confidence = 0;
    let note = '';
    let pending = 0;
    const knownSpeakers = speakerSet.filter(s => s && s.length >= 2);

    // 1) 明确点名："XX 你/请 XX/让 XX/安排 XX/XX 负责/XX 来/XX 需要/XX 这边/由 XX" 等
    for (const sp of knownSpeakers) {
      const esc = sp.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
      // 同时包含人名 + 触发词（两种相对位置）
      const hasName = new RegExp(esc).test(text);
      if (!hasName) continue;
      const triggerRe = /(请|让|安排|叫|找|由|交给|你来|您来|去|来|负责|跟进|处理|做|的|这边|需要|来做|来写|来出|来安排|来负责|去做|去跟进|能|可以|记得|马上|尽快)/;
      if (
        // "请 XX 做" / "让 XX 负责" / "安排 XX 跟进"
        /(请|让|安排|叫|找|由|交给)\s*[，,、]?\s*X+_PLACEHOLDER/.source.replace('X+_PLACEHOLDER', esc).length > 0 ||
        new RegExp(`(请|让|安排|叫|找|由|交给)\\s*[，,、]?\\s*${esc}`).test(text) ||
        // "XX 负责" / "XX 来" / "XX 需要" / "XX 这边" / "XX 你"
        new RegExp(`${esc}\\s*[，,、]?\\s*(你|您|负责|来|需要|的|这边|跟进|处理|做|写|出|去|安排|能|可以|记得)`).test(text) ||
        // "XX，要 ..." / "XX：做"
        new RegExp(`${esc}\\s*[，,：:].*(?:需要|得|要|完成|做|负责|跟进|处理)`).test(text)
      ) {
        assignee = sp;
        confidence = 0.9;
        note = `明确点名 ${sp}`;
        break;
      }
    }

    // 2) 发言者自称（非行首也可以，比如"好的，我来..."）
    if (!assignee && /(我|我们|本人|自己)\s*(来|会|这边|负责|可以|做|写|改|出|去|准备|安排|处理|跟进|搞定|承担|来做|来写|来安排|来完成|来负责)/.test(text) && segSpeaker) {
      assignee = segSpeaker;
      confidence = 0.88;
      note = `发言人"${segSpeaker}"主动认领（自称模式）`;
    }

    // 3) "某人的" 或仅提及 - 弱证据（比如"测试的王芳"、"XX做的"，但无明确"请/负责"）
    if (!assignee && !/相关|大家|有人|有的人|团队|对应|有空/.test(text)) {
      for (const sp of knownSpeakers) {
        const esc = sp.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(esc).test(text)) {
          assignee = sp;
          confidence = 0.6;
          note = `仅提到了 ${sp}，但未明确任务归属`;
          pending = 1;
          break;
        }
      }
    }

    // 4) 模糊人称
    if (!assignee) {
      for (const v of VAGUE_ASSIGNEE_WORDS) {
        if (text.includes(v)) {
          note = `使用了模糊表述"${v}"，未明确具体人员`;
          confidence = 0.2;
          pending = 1;
          break;
        }
      }
    }

    // 5) 什么都没有
    if (!assignee && confidence === 0) {
      pending = 1;
      note = '本段未提到具体负责人';
      confidence = 0.1;
    }

    return { assignee, confidence, note, pending };
  }

  // 优先级 + 里程碑判断
  function parsePriorityAndMilestone(text) {
    let priority = 'medium';
    let isMilestone = false;
    let milestoneConfidence = 0;
    let milestoneNote = null;

    if (HIGH_PRIORITY_WORDS.some(w => text.includes(w))) priority = 'high';
    else if (LOW_PRIORITY_WORDS.some(w => text.includes(w))) priority = 'low';

    // 里程碑：关键词出现 + 强上下文（"是里程碑/是节点/正式上线/版本发布/验收节点"）
    const STRONG_MS_RE = /(是|作为|定为|列为|算|就是|属于|称为|称之)?\s*(里程碑|节点|交付|正式上线|版本发布|大版本|验收)\s*(节点|日期|时间|的话|了|啊|哦|呢|！|。)?/;
    const DATE_WITH_MS_RE = /(\d{1,2}\s*月\s*\d{1,2}\s*[日号]|\d{4}[-_]\d{1,2}[-_]\d{1,2}|下周?[一二三四五六日天]|月底|季度末).*(?:的?\s*v\d|上线|发布|验收|交付|里程碑|版本)/;

    // 强触发：直接用 "是里程碑/是节点/验收节点/正式上线节点" 等
    if (STRONG_MS_RE.test(text) || DATE_WITH_MS_RE.test(text)) {
      for (const w of MILESTONE_WORDS) {
        if (text.includes(w)) {
          isMilestone = true;
          milestoneConfidence = 0.92;
          milestoneNote = `命中里程碑关键词"${w}"，上下文明确指向重大交付/版本节点`;
          priority = 'high';
          break;
        }
      }
    }
    // 弱触发：仅关键词（可能是里程碑，标记 pending，建议复核）
    if (!isMilestone) {
      for (const w of MILESTONE_WORDS) {
        if (text.includes(w)) {
          milestoneConfidence = Math.max(milestoneConfidence, 0.55);
          milestoneNote = `提及"${w}"，未发现明确节点声明，建议人工确认是否为里程碑`;
          break;
        }
      }
    }

    return { priority, isMilestone, milestoneConfidence, milestoneNote };
  }

  // 遍历每个段落，抽取行动项
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const speaker = (seg.speaker || '').trim();
    const text = seg.content || '';
    if (text.length < 4) continue;

    // 分句，按标点切
    const sentences = text.split(/(?<=[。！？!?；;，,])/).map(s => s.trim()).filter(s => s.length >= 3);

    for (const sent of sentences) {
      // 检查是否包含任一任务动词
      const hasTask = TASK_WORDS.some(w => sent.includes(w));
      const isDirective = /(请|需要|要|必须|得|务必|尽快|马上|按时)/.test(sent);

      if (!hasTask && !isDirective) continue;

      const asg = parseAssignee(sent, speaker, i);
      const dl = parseDateFromText(sent, speaker);
      const prm = parsePriorityAndMilestone(sent);

      // 抽取简洁的任务标题
      let title = sent;
      // 去掉明显的修饰前缀
      title = title.replace(/^(好的|嗯|那个|这个|是|那|行|可以|OK|okay|对|是的|没问题|收到)[，,。.\s]*/i, '');
      title = title.replace(/^(请|让|安排|叫|找|由|交给|务必|必须|需要|要|得|应该)\s*/, '');
      if (asg.assignee) {
        const esc = asg.assignee.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
        title = title.replace(new RegExp(`^${esc}\\s*[你您]?\\s*(来|需要|负责|这边|的)?\\s*[，,。.\\s]*`, 'i'), '');
      }
      title = title.replace(/^[，,。.；;！!？?\s]+/, '');
      title = title.replace(/[，,。.；;！!？?\s]+$/, '');
      if (title.length > 60) title = title.slice(0, 57) + '...';
      if (title.length < 3) title = sent.slice(0, 30);

      // 组装置信度
      const itemConf = (asg.confidence + (dl.date ? dl.confidence : 0.6)) / 2;
      actionItems.push({
        title,
        description: sent.length > title.length ? sent : null,
        assignee: asg.assignee,
        assignee_confidence: asg.confidence,
        assignee_pending: asg.pending ? 1 : (asg.confidence < config.thresholds.assignee ? 1 : 0),
        assignee_note: asg.note || null,
        deadline: dl.date,
        deadline_confidence: dl.confidence,
        deadline_pending: (!dl.date || dl.confidence < config.thresholds.deadline) ? 1 : 0,
        deadline_note: dl.note || (dl.date ? null : '本段无明确时间信息'),
        priority: prm.priority,
        is_milestone: prm.isMilestone ? 1 : 0,
        milestone_confidence: prm.milestoneConfidence,
        milestone_note: prm.milestoneNote,
        project_name: projectName || null,
        related_segment_index: i,
        extraction_confidence: itemConf,
        needs_review: 0, // 由 _applyThresholds 重新计算
        review_reason: null,
      });
    }
  }

  // 议题检测（简单按段落聚合）
  const topics = [];
  if (segments.length > 0) {
    topics.push({
      title: '综合讨论',
      description: `${segments.length} 段发言，抽取 ${actionItems.length} 个行动项`,
      start_segment_index: 0,
      end_segment_index: segments.length - 1,
    });
  }

  return {
    action_items: actionItems,
    topics,
    speakers: speakerSet.map(s => ({
      raw_alias: s,
      normalized_name: s,
      role_hint: null,
    })),
    warnings: actionItems.filter(a => a.assignee_pending || a.deadline_pending).length > 0
      ? [`共 ${actionItems.filter(a => a.assignee_pending).length} 个行动项负责人待确认，${actionItems.filter(a=>a.deadline_pending).length} 个截止日期待确认`]
      : [],
  };
}

async function extractActionItems(ctx, opts = {}) {
  const start = Date.now();
  const { useModel = config.openai.model } = opts;
  const userPrompt = buildUserPrompt(ctx);

  // Mock/启发式 fallback: 没有 Key 或明确指定 mock 时，用规则抽取
  const hasKey = config.openai.apiKey && config.openai.apiKey.length > 5 && !/your|sk-xxx|demo|placeholder/i.test(config.openai.apiKey);
  if (!hasKey || opts.forceMock) {
    logger.info('[extract] Using heuristic mock extractor (no OpenAI key or forceMock)');
    const mockResult = _heuristicExtract(ctx);
    const thresholded = _applyThresholds(mockResult);
    thresholded._meta = {
      model: 'heuristic-mock',
      tokens: { prompt_tokens: userPrompt.length, completion_tokens: 0, total_tokens: 0 },
      latencyMs: Date.now() - start,
      rawResponse: JSON.stringify(mockResult),
    };
    return thresholded;
  }

  logger.info(`[extract] Calling OpenAI ${useModel}, prompt length: ${userPrompt.length}`);

  let resp;
  try {
    const openai = getClient();
    resp = await openai.chat.completions.create({
      model: useModel,
      temperature: config.openai.temperature,
      max_tokens: config.openai.maxTokens,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });
  } catch (err) {
    logger.warn(`[extract] OpenAI call failed (${err.message}), falling back to heuristic`);
    const mockResult = _heuristicExtract(ctx);
    const thresholded = _applyThresholds(mockResult);
    thresholded._meta = {
      model: 'heuristic-mock-fallback',
      tokens: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      latencyMs: Date.now() - start,
      rawResponse: JSON.stringify(mockResult),
      error: err.message,
    };
    return thresholded;
  }

  const rawContent = resp.choices[0].message.content || '{}';
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (e) {
    logger.warn('[extract] JSON parse failed, falling back to heuristic', { error: e.message, raw: rawContent.slice(0, 300) });
    const mockResult = _heuristicExtract(ctx);
    const thresholded = _applyThresholds(mockResult);
    thresholded._meta = {
      model: 'heuristic-json-fallback',
      tokens: { ...(resp.usage || {}) },
      latencyMs: Date.now() - start,
      rawResponse: rawContent,
    };
    return thresholded;
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

    // 里程碑：支持 boolean true / 数字 1 两种输入（兼容 mock 和 heuristic）
    if (out.is_milestone) {
      if (!out.milestone_confidence || out.milestone_confidence < config.thresholds.milestone) {
        out.is_milestone = 0;
        out.milestone_note = out.milestone_note || `里程碑置信度不足（${(out.milestone_confidence||0).toFixed(2)} < ${config.thresholds.milestone}），已降级为普通行动项`;
      } else {
        out.is_milestone = 1;
        out.milestone_note = out.milestone_note || null;
      }
    } else {
      out.is_milestone = 0;
      if (!out.milestone_note) out.milestone_note = '未在会议中被明确标记为里程碑';
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
