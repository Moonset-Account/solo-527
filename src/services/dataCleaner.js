const natural = require('natural');
const logger = require('../utils/logger');

const tokenizer = new natural.WordTokenizer();

const STOPWORDS = new Set([
  '的', '了', '和', '是', '在', '我', '有', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '它', '这个', '那个', '什么', '怎么', '为什么',
  '能', '可以', '应该', '请', '谢谢', '您好', '你好', '喂', '嗯', '啊',
  '哦', '吧', '呢', '吗', '呀', '哈', '那个', '就是', '还是', '但是', '因为',
  '所以', '如果', '然后', '现在', '之前', '以后', '已经', '一直', '可能',
  '觉得', '知道', '认为', '关于', '对于', '进行', '通过', '由于', '以及',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to',
  'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
]);

const PHONE_REGEX = /(?:\+?86[-\s]?)?1[3-9]\d{9}|0\d{2,3}[-\s]?\d{7,8}/g;
const ID_REGEX = /[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_REGEX = /https?:\/\/[^\s]+/g;
const SPACE_REGEX = /\s+/g;
const REPEAT_CHAR_REGEX = /(.)\1{3,}/g;

function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u200b-\u200f\uFEFF]/g, '')
    .trim();
}

function maskPII(text) {
  let result = text;
  result = result.replace(PHONE_REGEX, '[手机号]');
  result = result.replace(ID_REGEX, '[身份证号]');
  result = result.replace(EMAIL_REGEX, '[邮箱]');
  result = result.replace(URL_REGEX, '[链接]');
  return result;
}

function removeNoise(text) {
  let result = text;
  result = result.replace(REPEAT_CHAR_REGEX, '$1$1$1');
  result = result.replace(/[<>{}【】\[\]（）()""''`~!@#$%^&*_+=|\\\/;:,.<>?，。；：！？、]/g, ' ');
  result = result.replace(SPACE_REGEX, ' ').trim();
  return result;
}

function tokenizeText(text) {
  if (!text) return [];
  const tokens = [];
  const segments = text.split(/[\s，。！？、；：,.!?;:()（）【】\[\]"'"]+/);
  for (const seg of segments) {
    if (!seg) continue;
    if (/^[\u4e00-\u9fa5]+$/.test(seg) && seg.length > 1) {
      for (let len = Math.min(seg.length, 4); len >= 2; len--) {
        for (let i = 0; i <= seg.length - len; i++) {
          tokens.push(seg.slice(i, i + len));
        }
      }
      for (const char of seg) tokens.push(char);
    } else {
      tokens.push(seg);
      const sub = tokenizer.tokenize(seg.toLowerCase());
      tokens.push(...sub);
    }
  }
  return tokens.filter(t => t && !STOPWORDS.has(t));
}

function extractKeywords(text, topK = 10) {
  const tokens = tokenizeText(text);
  const freq = new Map();
  for (const t of tokens) {
    freq.set(t, (freq.get(t) || 0) + 1);
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([word, count]) => ({ word, count }));
}

const DISTRICT_MAP = {
  '朝阳': '朝阳区', '海淀': '海淀区', '西城': '西城区', '东城': '东城区',
  '丰台': '丰台区', '石景山': '石景山区', '通州': '通州区', '昌平': '昌平区',
  '大兴': '大兴区', '顺义': '顺义区', '房山': '房山区', '门头沟': '门头沟区',
  '平谷': '平谷区', '怀柔': '怀柔区', '密云': '密云区', '延庆': '延庆区',
};

const BLOCK_MAP = {
  '望京': '望京街道', '国贸': '建外街道', '中关村': '中关村街道',
  '三里屯': '三里屯街道', '五道口': '东升地区', '西单': '西长安街街道',
  '王府井': '东华门街道', '亚运村': '亚运村街道', '回龙观': '回龙观街道',
  '天通苑': '天通苑北街道',
};

function extractLocation(text) {
  const result = { district: null, block: null, community: null };
  for (const [key, val] of Object.entries(DISTRICT_MAP)) {
    if (text.includes(key)) {
      result.district = val;
      break;
    }
  }
  for (const [key, val] of Object.entries(BLOCK_MAP)) {
    if (text.includes(key)) {
      result.block = val;
      break;
    }
  }
  const commMatch = text.match(/([\u4e00-\u9fa5]{2,8}(?:小区|花园|家园|公寓|苑|村|路|街|号院|里))/);
  if (commMatch) {
    result.community = commMatch[1];
  }
  return result;
}

const URGENCY_PATTERNS = [
  { level: '特急', regex: /(死人|人命|着火|爆炸|倒塌|坍塌|煤气.*泄漏|天然气.*漏|跳楼|自杀|触电|溺水|重伤|昏迷|休克|大量出血)/ },
  { level: '紧急', regex: /(尽快|立刻|马上|紧急|着急|急死人|严重|危险|威胁|报警|110|119|120)/ },
  { level: '缓办', regex: /(咨询|建议|了解|查询|询问|反映一下|建议.*能够|能否.*考虑)/ },
];

function detectUrgencyByKeywords(text) {
  for (const p of URGENCY_PATTERNS) {
    if (p.regex.test(text)) return p.level;
  }
  return '一般';
}

const HIGH_RISK_PATTERNS = [
  /(安全生产|安全事故|爆炸|火灾|坍塌|中毒|触电|群死|群伤)/,
  /(信访|上访|维稳|群体|聚集|闹事|堵路|拉横幅)/,
  /(疫情|传染病|新冠|阳性|确诊|疑似|隔离|密接|暴发)/,
  /(讨薪|欠薪|农民工.*工资|跳楼.*要|爬楼|爬塔吊|自残|威胁.*自杀)/,
  /(投诉.*政府|举报.*官员|纪委|检察院|涉黑|涉恶|腐败|贪污|受贿)/,
];

function detectHighRisk(text, category = '') {
  const all = `${text} ${category}`;
  return HIGH_RISK_PATTERNS.some(p => p.test(all));
}

function cleanTicketRecord(record) {
  const startContent = record.content || record.text || record.description || '';
  const normalized = normalizeText(startContent);
  const masked = maskPII(normalized);
  const cleaned = removeNoise(masked);
  const keywords = extractKeywords(cleaned);
  const location = extractLocation(normalized);
  const keywordUrgency = detectUrgencyByKeywords(normalized);
  const highRisk = detectHighRisk(normalized, record.original_category || '');

  return {
    ...record,
    content_raw: startContent,
    content_cleaned: cleaned,
    content_normalized: normalized,
    content_masked: masked,
    keywords,
    extracted_location: location,
    district: record.district || location.district || record.qu,
    block: record.block || location.block || record.jiedao,
    community: record.community || location.community || record.xiaoqu,
    urgency_hint: keywordUrgency,
    high_risk_hint: highRisk,
  };
}

function cleanHistoricalRecords(records) {
  const results = [];
  let skipped = 0;
  for (const rec of records) {
    const content = rec.content || rec.text || rec.description;
    if (!content || content.length < 5) {
      skipped++;
      continue;
    }
    const cleaned = cleanTicketRecord(rec);
    if (cleaned.content_cleaned.length < 5) {
      skipped++;
      continue;
    }
    results.push(cleaned);
  }
  logger.info(`Data cleaning: ${records.length} in, ${results.length} kept, ${skipped} skipped`);
  return results;
}

module.exports = {
  normalizeText,
  maskPII,
  removeNoise,
  tokenizeText,
  extractKeywords,
  extractLocation,
  detectUrgencyByKeywords,
  detectHighRisk,
  cleanTicketRecord,
  cleanHistoricalRecords,
};
