/**
 * 数据清洗模块
 * 处理原始转写文本，规范化、去除噪声、分段
 */
const logger = require('../utils/logger');

const NOISE_PATTERNS = [
  /^\s*[\(\[（【](?:静音|沉默|噪声|音乐|掌声|咳嗽|叹气|笑声|停顿)[\)\]）】]\s*$/i,
  /^\s*[嗯啊呃哦呃呃呃呃呃呃呃呃]+[,.，。]*\s*$/i,
  /^\s*\d+[:：]\d+(?:[:：]\d+)?\s*[-—–]\s*.*$/m,
];

const CONVERSION_MAP = {
  '他她它': '他',
  '这个这个': '这个',
  '就是说': '',
  '然后然后': '然后',
  '那个那个': '那个',
  'kind of': '',
  'sort of': '',
  'you know': '',
  'i mean': '',
};

function cleanText(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let text = raw.trim();

  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (const pattern of NOISE_PATTERNS) {
    text = text.replace(pattern, '');
  }

  for (const [src, dst] of Object.entries(CONVERSION_MAP)) {
    text = text.replace(new RegExp(src, 'gi'), dst);
  }

  text = text.replace(/\s+/g, ' ').trim();
  text = text.replace(/([,.，。])\1+/g, '$1');
  text = text.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return text;
}

/**
 * 正则：匹配行首的发言人标签前缀（多种格式）
 * 支持：
 *   [项目经理 李明] xxx
 *   【项目经理-李明】xxx
 *   （李明）xxx
 *   (Speaker 1) xxx
 *   发言人A：xxx
 *   李明：xxx
 *   Speaker 1: xxx
 *   说话人1: xxx
 */
const SPEAKER_PREFIX_REGEX = new RegExp(
  '^\\s*' +
  // 括号类: [xxx] 【xxx】 (xxx) （xxx） 后面可有空格+冒号
  '(?:' +
    '[\\[【\\(（][^\\]】\\)）]{1,50}[\\]】\\)）]\\s*[:：]?\\s+' +
    '|' +
    // 冒号类: xxx： 或 xxx: (前面只能是2-20字，含中英文数字，且不能全是纯数字)
    '((?![0-9]+[：:])(?![0-9.]+\\s+[：:])[\\u4e00-\\u9fa5A-Za-z0-9·._\\-\\s]{2,20})[:：]\\s+' +
    '|' +
    // 标准发言人前缀：发言人/说话人/Speaker + 数字/字母 + 冒号
    '(?:发言人|说话人|Speaker)\\s*[_\\-#]?\\s*[0-9A-Za-z一二三四五六七八九十甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]?\\s*[:：]\\s*' +
  ')',
  'im'
);

const BRACKET_SPEAKER_REGEX = /^[\[【\(（]([^\]】\)）]{1,50})[\]】\)）]/;
const COLON_SPEAKER_REGEX = /^([\u4e00-\u9fa5A-Za-z0-9·._\-\s]{2,20})[:：]/;
const STANDARD_SPEAKER_REGEX = /^(?:发言人|说话人|Speaker)\s*[_\-#]?\s*([0-9A-Za-z一二三四五六七八九十甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]?)\s*[:：]/i;

/**
 * 从发言人标签字符串提取角色和姓名
 * 例如："项目经理 李明" → { role: "项目经理", name: "李明" }
 *       "李明" → { role: null, name: "李明" }
 *       "产品-张三" → { role: "产品", name: "张三" }
 */
function parseSpeakerLabel(label) {
  if (!label) return { role: null, name: '', raw: label };
  const raw = String(label).trim();

  // 分隔符类: 空格、"的"、"-"、"_"
  const parts = raw.split(/[\s\-_的、，,]+/).filter(p => p && p.trim());
  if (parts.length === 0) return { role: null, name: raw, raw };

  // 已知角色关键词
  const ROLE_KEYWORDS = [
    '项目经理', '产品经理', '产品', '技术总监', '技术负责人', '架构师',
    '后端工程师', '前端工程师', '全栈工程师', '测试工程师', 'QA', '运维工程师',
    '设计师', 'UI设计师', 'UX设计师', '市场总监', '销售经理', '运营经理',
    'CEO', 'CTO', 'COO', 'CFO', '总监', '经理', '主管', '组长', '负责人',
    '工程师', '开发', '开发工程师', '助理', '客户', '用户', '老板', '总',
    '专家', '顾问', '实习生', 'HR', '人事', '财务', '法务',
  ];

  // 找出角色词
  let role = null;
  let name = raw;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (ROLE_KEYWORDS.some(r => part.includes(r) || r.includes(part))) {
      role = part;
      // 其余部分拼接为姓名
      const remaining = parts.slice(0, i).concat(parts.slice(i + 1));
      if (remaining.length > 0) name = remaining.join('');
      else name = parts.slice(1).join('') || raw;
      break;
    }
  }

  // 如果全是中文 2-4 字且没识别出角色，视为纯姓名
  if (!role && /^[\u4e00-\u9fa5]{2,4}$/.test(raw)) {
    name = raw;
  }

  return {
    role,
    name: name ? name.trim() : raw,
    raw,
  };
}

function normalizeSpeakerName(raw) {
  if (!raw) return '';
  // 如果是括号里的标签
  let label = String(raw).trim();
  const bracketMatch = label.match(BRACKET_SPEAKER_REGEX);
  if (bracketMatch) label = bracketMatch[1].trim();

  // 去除「发言人/Speaker/说话人」前缀
  label = label.replace(/^(?:发言人|Speaker|说话人)\s*[_\-#]?\s*[0-9A-Za-z一二三四五六七八九十甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]?\s*[:：]?\s*/i, '');
  label = label.replace(/[:：]+$/, '').trim();

  // 解析并取姓名部分
  const parsed = parseSpeakerLabel(label);
  if (parsed.name) return parsed.name;
  return label;
}

/**
 * 识别发言人角色（可选），供后续 metadata 使用
 */
function extractSpeakerRole(raw) {
  if (!raw) return null;
  const label = String(raw).trim();
  const bracketMatch = label.match(BRACKET_SPEAKER_REGEX);
  const content = bracketMatch ? bracketMatch[1] : label.replace(/[:：]+$/, '');
  const parsed = parseSpeakerLabel(content);
  return parsed.role;
}

function splitBySpeaker(text) {
  const segments = [];
  const lines = String(text || '').split('\n');
  let current = null;

  for (const rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    // 尝试多种发言人前缀匹配
    let speakerLabel = '';
    let content = '';
    let matched = false;

    // 1) 括号类: [...] 【...】 (...) （...）
    let m = line.match(/^[\[【\(（]([^\]】\)）]{1,50})[\]】\)）]\s*[:：]?\s*(.*)$/);
    if (m) {
      speakerLabel = m[1];
      content = m[2].trim();
      matched = true;
    }

    // 2) 标准发言人前缀
    if (!matched) {
      m = line.match(/^((?:发言人|说话人|Speaker)\s*[_\-#]?\s*[0-9A-Za-z一二三四五六七八九十甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥]?)\s*[:：]\s*(.*)$/i);
      if (m) {
        speakerLabel = m[1];
        content = m[2].trim();
        matched = true;
      }
    }

    // 3) 普通冒号类：「李明：xxx」——但要避免误匹配时间(9:30)、纯数字编号和句子内部的冒号
    if (!matched) {
      m = line.match(/^([\u4e00-\u9fa5A-Za-z·._\-]{2,15}(?:\s+[\u4e00-\u9fa5A-Za-z·._\-]{1,10})?)\s*[:：]\s*(.*)$/);
      if (m) {
        const candidate = m[1];
        // 跳过显然不是发言人的情况：纯数字、含日期时间、太长
        if (!/^[0-9.:：]+$/.test(candidate) &&
            !/\d{1,2}[:：]\d{1,2}/.test(candidate) &&
            candidate.length <= 20) {
          speakerLabel = candidate;
          content = m[2].trim();
          matched = true;
        }
      }
    }

    if (matched) {
      if (current) segments.push(current);
      current = {
        speaker: normalizeSpeakerName(speakerLabel),
        speaker_role: extractSpeakerRole(speakerLabel),
        speaker_raw: speakerLabel,
        content: cleanText(content),
        raw: rawLine,
        start_time: null,
        end_time: null,
      };
    } else if (current) {
      // 没有发言人前缀，拼接到上一条
      current.content = (current.content + ' ' + cleanText(line)).trim();
      current.raw += '\n' + rawLine;
    } else {
      // 第一条就没有发言人，保留无发言人段落
      current = {
        speaker: '',
        speaker_role: null,
        speaker_raw: '',
        content: cleanText(line),
        raw: rawLine,
        start_time: null,
        end_time: null,
      };
    }
  }
  if (current) segments.push(current);
  return segments;
}

function detectTopics(segments, threshold = 4) {
  const topics = [];
  const topicKeywords = {
    '进度汇报': ['进度', '汇报', '完成', '进展', 'status', 'update'],
    '需求讨论': ['需求', '功能', 'feature', 'requirement', 'spec'],
    '技术方案': ['方案', '架构', '设计', '技术', 'design', 'architecture'],
    '问题排查': ['问题', 'bug', '故障', '错误', 'error', 'issue'],
    '排期计划': ['排期', '计划', 'deadline', 'milestone', 'schedule', '时间'],
    '风险识别': ['风险', 'risk', '阻塞', 'blocker', '依赖'],
  };

  let currentTopic = null;
  let startIdx = 0;

  segments.forEach((seg, idx) => {
    const content = (seg.content || '').toLowerCase();
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      const count = keywords.reduce((sum, kw) => sum + (content.includes(kw.toLowerCase()) ? 1 : 0), 0);
      if (count >= threshold) {
        if (currentTopic && currentTopic !== topic) {
          topics.push({
            title: currentTopic,
            start_segment_index: startIdx,
            end_segment_index: Math.max(0, idx - 1),
          });
        }
        if (currentTopic !== topic) {
          currentTopic = topic;
          startIdx = idx;
        }
      }
    }
  });

  if (currentTopic) {
    topics.push({
      title: currentTopic,
      start_segment_index: startIdx,
      end_segment_index: segments.length - 1,
    });
  }

  if (topics.length === 0 && segments.length > 0) {
    topics.push({ title: '综合讨论', start_segment_index: 0, end_segment_index: segments.length - 1 });
  }

  return topics;
}

function parseVTT(rawVtt) {
  const segments = [];
  const cueRegex = /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})\n([\s\S]*?)(?=\n\d{2}:\d{2}:\d{2}|$)/g;
  let m;
  while ((m = cueRegex.exec(rawVtt)) !== null) {
    const startTime = _timeToSeconds(m[1]);
    const endTime = _timeToSeconds(m[2]);
    const contentBlock = m[3].trim();
    const lines = contentBlock.split('\n').filter(l => l.trim());
    let speaker = '';
    let content = '';
    if (lines.length >= 2 && /[<【(]/.test(lines[0]) || lines[0].endsWith(':')) {
      speaker = normalizeSpeakerName(lines[0].replace(/[:：<【(（].*$/, ''));
      content = lines.slice(1).join(' ');
    } else {
      content = lines.join(' ');
    }
    segments.push({
      speaker,
      content: cleanText(content),
      start_time: startTime,
      end_time: endTime,
      raw: contentBlock,
    });
  }
  return segments;
}

function parseSRT(rawSrt) {
  const segments = [];
  const blocks = rawSrt.trim().split(/\n\s*\n/);
  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim());
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!timeMatch) continue;
    const start = _timeToSeconds(timeMatch[1].replace(',', '.'));
    const end = _timeToSeconds(timeMatch[2].replace(',', '.'));
    const content = lines.slice(2).join(' ');
    segments.push({
      speaker: '',
      content: cleanText(content),
      start_time: start,
      end_time: end,
      raw: lines.slice(2).join('\n'),
    });
  }
  return segments;
}

function _timeToSeconds(t) {
  const parts = t.split(':');
  if (parts.length < 3) return 0;
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const s = parseFloat(parts[2]);
  return h * 3600 + m * 60 + s;
}

function parseTranscript(raw, format = 'auto') {
  const fmt = format !== 'auto' ? format : _detectFormat(raw);
  logger.info(`[clean] Parsing transcript with format: ${fmt}`);

  switch (fmt) {
    case 'vtt':
      return { segments: parseVTT(raw), format: 'vtt' };
    case 'srt':
      return { segments: parseSRT(raw), format: 'srt' };
    case 'speaker-tagged':
      return { segments: splitBySpeaker(raw), format: 'speaker-tagged' };
    case 'plain':
    default: {
      const sentences = cleanText(raw).split(/(?<=[.!?。！？])\s+/);
      return {
        segments: sentences.map((s, i) => ({
          speaker: '',
          content: s.trim(),
          start_time: null,
          end_time: null,
          raw: s,
        })).filter(s => s.content),
        format: 'plain',
      };
    }
  }
}

function _detectFormat(raw) {
  if (/^WEBVTT/i.test(raw)) return 'vtt';
  if (/^\d+\s*\n\d{2}:\d{2}:\d{2}[,.]/m.test(raw)) return 'srt';
  // 括号类发言人: [xxx] 【xxx】 占行首
  if (/^\s*[\[【\(（][^\]】\)）]{1,50}[\]】\)）]\s*[:：]?\s+/m.test(raw)) return 'speaker-tagged';
  // 标准发言人前缀: 发言人/说话人/Speaker + 冒号
  if (/^(?:发言人|Speaker|说话人)\s*#?\d*[:：]/im.test(raw)) return 'speaker-tagged';
  // 行首冒号模式: 3+ 行符合 "2-15字 + 冒号" 的模式
  const lines = String(raw).split('\n').filter(l => l.trim());
  let colonCount = 0;
  for (const l of lines) {
    if (/^[\u4e00-\u9fa5A-Za-z·._\-]{2,15}(?:\s+[\u4e00-\u9fa5A-Za-z·._\-]{1,10})?\s*[:：]\s+\S/.test(l.trim())) colonCount++;
  }
  if (colonCount >= 2) return 'speaker-tagged';
  return 'plain';
}

module.exports = {
  cleanText,
  normalizeSpeakerName,
  splitBySpeaker,
  parseTranscript,
  parseVTT,
  parseSRT,
  detectTopics,
  _timeToSeconds,
};
