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

function normalizeSpeakerName(raw) {
  if (!raw) return '';
  let name = String(raw).trim();
  name = name.replace(/^发言人[_\s-]*#?\d*/i, '');
  name = name.replace(/^Speaker[_\s-]*#?\d*/i, '');
  name = name.replace(/^说话人[_\s-]*#?\d*/i, '');
  name = name.replace(/[【\(\[（].*?[】\)\]）]/g, '');
  name = name.trim();
  if (!name) return raw.trim();
  return name;
}

function splitBySpeaker(text, speakerPrefixPattern = /^(?:发言人|Speaker|说话人)\s*#?\d*[:：]/im) {
  const segments = [];
  const lines = text.split('\n');
  let current = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = line.match(speakerPrefixPattern);
    if (match) {
      if (current) segments.push(current);
      const speakerTag = match[0];
      const content = line.slice(speakerTag.length).trim();
      current = {
        speaker: normalizeSpeakerName(speakerTag),
        content: cleanText(content),
        raw: rawLine,
      };
    } else if (current) {
      current.content += ' ' + cleanText(line);
      current.raw += '\n' + rawLine;
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
  if (/^(?:发言人|Speaker|说话人)\s*#?\d*[:：]/im.test(raw)) return 'speaker-tagged';
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
