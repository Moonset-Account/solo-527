const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const logger = require('../utils/logger');
const { getDb } = require('../utils/database');
const { chatCompletion } = require('./openaiClient');
const { searchSimilar } = require('./vectorStore');
const { detectHighRisk, detectUrgencyByKeywords } = require('./dataCleaner');

function buildCategoryPrompt(content, district, block, originalCategory, similarResults) {
  const similarText = similarResults.length > 0
    ? `
【历史相似工单参考】
${similarResults.map((r, i) => `${i + 1}. 类别:${r.category} | 承办:${r.department_name} | 相似度:${r.score}
   内容摘要: ${r.resolution || (r.content ? r.content.slice(0, 80) : '无')}`).join('\n')}
` : '无历史相似工单';

  return [
    {
      role: 'system',
      content: `你是社区热线诉求分拨专家。请严格按照以下要求完成任务：
1. 从候选类别中选择最匹配的诉求分类
2. 判断紧急程度（特急/紧急/一般/缓办）
3. 推荐最合适的承办科室
4. 为每一项给出0-1之间的置信度
5. 判断是否属于高风险民生诉求
6. 输出严格JSON格式

候选类别：${config.categories.join('、')}
承办科室列表：
${config.departments.map(d => `${d.code} ${d.name} 负责类别：${d.categories.join('、')}`).join('\n')}

高风险民生诉求包括但不限于：${config.thresholds.highRiskCategories.join('、')}，以及涉及生命安全、群体事件、安全生产事故等内容。

JSON输出格式示例：
{
  "category": "环境卫生",
  "category_confidence": 0.92,
  "urgency": "一般",
  "urgency_confidence": 0.88,
  "department_code": "CSB",
  "department_name": "城市管理局",
  "department_confidence": 0.90,
  "is_high_risk": false,
  "needs_review": false,
  "review_reason": "",
  "reasoning": "简要说明判断依据"
}`
    },
    {
      role: 'user',
      content: `
来电信息：
- 来电文本：${content}
- 所在区域：${district || '未提供'} / ${block || '未提供'}
- 初始登记类别：${originalCategory || '未提供'}

${similarText}

请根据以上信息输出分拨建议JSON。`
    }
  ];
}

async function inferTicketAssignment(params) {
  const {
    id,
    content,
    district,
    block,
    community,
    originalCategory,
    callerName,
    callerPhone,
    modelVersion = 'v1.0',
  } = params;

  const ticketId = id || uuidv4();
  const startTime = Date.now();

  logger.info('Starting inference', { ticketId, contentLen: content.length });

  let similarResults = [];
  try {
    const sim = await searchSimilar(content, { topK: 3, minScore: 0.55 });
    similarResults = sim.results;
  } catch (e) {
    logger.warn('Similar search failed, proceeding without it', { error: e.message });
  }

  const messages = buildCategoryPrompt(content, district, block, originalCategory, similarResults);

  let parsedResult;
  let tokensUsed = 0;
  let latencyMs = 0;

  try {
    const { content: respContent, tokens } = await chatCompletion(messages, { temperature: 0.1, max_tokens: 1500 });
    latencyMs = Date.now() - startTime;
    tokensUsed = tokens;

    try {
      parsedResult = JSON.parse(respContent);
    } catch (parseErr) {
      logger.warn('Failed to parse JSON response, extracting...', { preview: respContent.slice(0, 200) });
      const jsonMatch = respContent.match(/\{[\s\S]*\}/);
      parsedResult = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }
  } catch (err) {
    logger.error('Chat completion failed, using fallback inference', { error: err.message });
  }

  if (!parsedResult) {
    parsedResult = buildFallbackResult(content, originalCategory);
  }

  const enriched = enrichResult(parsedResult, content, originalCategory, similarResults);
  enriched.latency_ms = latencyMs;
  enriched.tokens_used = tokensUsed;
  enriched.similar_tickets = similarResults;

  const needsReview = determineReviewNeeds(enriched);
  enriched.needs_review = needsReview.needsReview;
  enriched.review_reason = enriched.review_reason || needsReview.reason;
  enriched.review_type = needsReview.reviewType;

  const finalStatus = determineFinalStatus(enriched);
  enriched.status = finalStatus;

  logInference(ticketId, 'assignment', content, enriched, tokensUsed, latencyMs);

  return {
    ticket_id: ticketId,
    model_version: modelVersion,
    ...enriched,
  };
}

function buildFallbackResult(content, originalCategory) {
  const urgency = detectUrgencyByKeywords(content);
  const isHighRisk = detectHighRisk(content, originalCategory);

  let category = originalCategory || '其他民生诉求';
  if (!config.categories.includes(category)) category = '其他民生诉求';

  let dept = config.departments.find(d => d.categories.includes(category));
  if (!dept) dept = config.departments[config.departments.length - 1];

  return {
    category,
    category_confidence: 0.5,
    urgency,
    urgency_confidence: 0.6,
    department_code: dept.code,
    department_name: dept.name,
    department_confidence: 0.5,
    is_high_risk: isHighRisk,
    needs_review: true,
    review_reason: '模型推理失败，进入人工复核',
    reasoning: 'LLM调用失败，使用关键词规则兜底',
  };
}

function enrichResult(result, content, originalCategory, similarResults) {
  const r = { ...result };

  if (!config.categories.includes(r.category)) {
    r.category = '其他民生诉求';
    r.category_confidence = Math.min(r.category_confidence || 0.5, 0.6);
  }

  if (!config.urgencyLevels.find(u => u.level === r.urgency)) {
    r.urgency = detectUrgencyByKeywords(content);
    r.urgency_confidence = 0.55;
  }

  const dept = config.departments.find(d => d.code === r.department_code || d.name === r.department_name);
  if (dept) {
    r.department_code = dept.code;
    r.department_name = dept.name;
  } else {
    const fallback = config.departments.find(d => d.categories.includes(r.category)) || config.departments[config.departments.length - 1];
    r.department_code = fallback.code;
    r.department_name = fallback.name;
    r.department_confidence = Math.min(r.department_confidence || 0.5, 0.55);
  }

  const keywordRisk = detectHighRisk(content, originalCategory);
  r.is_high_risk = Boolean(r.is_high_risk || keywordRisk);

  r.category_confidence = clamp01(r.category_confidence);
  r.urgency_confidence = clamp01(r.urgency_confidence);
  r.department_confidence = clamp01(r.department_confidence);

  if (similarResults.length >= 2) {
    const sameCategoryCount = similarResults.filter(s => s.category === r.category).length;
    if (sameCategoryCount >= 2 && r.category_confidence < 0.9) {
      r.category_confidence = Math.min(0.95, r.category_confidence + 0.05);
    }
  }

  return r;
}

function clamp01(v) {
  const n = parseFloat(v);
  if (isNaN(n)) return 0.5;
  return Math.max(0.01, Math.min(0.99, n));
}

function determineReviewNeeds(result) {
  if (result.is_high_risk) {
    return { needsReview: true, reason: '高风险民生诉求，必须人工确认', reviewType: 'high_risk' };
  }

  const minConf = Math.min(
    result.category_confidence,
    result.urgency_confidence,
    result.department_confidence
  );
  if (minConf < config.thresholds.lowConfidence) {
    return { needsReview: true, reason: `置信度低于阈值(${minConf.toFixed(2)} < ${config.thresholds.lowConfidence})`, reviewType: 'confidence_low' };
  }

  if (result.needs_review) {
    return { needsReview: true, reason: result.review_reason || '模型建议人工复核', reviewType: 'manual' };
  }

  if (result.category === '其他民生诉求' && result.category_confidence < 0.8) {
    return { needsReview: true, reason: '诉求落入通用类别，需人工确认细分', reviewType: 'manual' };
  }

  return { needsReview: false, reason: '', reviewType: '' };
}

function determineFinalStatus(result) {
  if (result.is_high_risk) return 'escalated';
  if (result.needs_review) return 'reviewing';
  return 'auto_assigned';
}

function logInference(ticketId, type, input, output, tokens, latency) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO inference_logs (id, ticket_id, model_name, inference_type, input_text, output_json, confidence, latency_ms, tokens_used, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      uuidv4(),
      ticketId,
      config.openai.chatModel,
      type,
      input.slice(0, 2000),
      JSON.stringify(output).slice(0, 5000),
      Math.min(output.category_confidence, output.department_confidence),
      latency,
      tokens
    );
  } catch (e) {
    logger.warn('Failed to log inference', { error: e.message });
  }
}

async function saveInferenceResult(params, inference) {
  const db = getDb();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO tickets (
      id, ticket_no, caller_name, caller_phone, caller_address, district, block, community,
      content, original_category, category, category_confidence, urgency, urgency_confidence,
      department_code, department_name, department_confidence, status, is_high_risk, needs_review,
      review_reason, created_at, updated_at, assigned_at, model_version, raw_inference_result
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ticketNo = params.ticketNo || generateTicketNo();
  stmt.run(
    inference.ticket_id,
    ticketNo,
    params.callerName || null,
    params.callerPhone || null,
    params.callerAddress || null,
    inference.district || params.district || null,
    inference.block || params.block || null,
    params.community || null,
    params.content,
    params.originalCategory || null,
    inference.category,
    inference.category_confidence,
    inference.urgency,
    inference.urgency_confidence,
    inference.department_code,
    inference.department_name,
    inference.department_confidence,
    inference.status,
    inference.is_high_risk ? 1 : 0,
    inference.needs_review ? 1 : 0,
    inference.review_reason || null,
    now,
    now,
    inference.status === 'auto_assigned' ? now : null,
    inference.model_version,
    JSON.stringify(inference)
  );

  if (inference.needs_review) {
    const reviewStmt = db.prepare(`
      INSERT INTO ticket_reviews (
        id, ticket_id, review_type, original_category, original_urgency, original_department,
        review_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `);
    reviewStmt.run(
      uuidv4(),
      inference.ticket_id,
      inference.review_type || 'manual',
      inference.category,
      inference.urgency,
      inference.department_code
    );
  }

  return { ticket_id: inference.ticket_id, ticket_no: ticketNo, status: inference.status };
}

function generateTicketNo() {
  const d = new Date();
  const ts = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RX${ts}${rand}`;
}

function pad2(n) { return n.toString().padStart(2, '0'); }

async function processTicketAndSave(params) {
  const inference = await inferTicketAssignment(params);
  const saved = await saveInferenceResult(params, inference);
  return { ...saved, inference };
}

module.exports = {
  inferTicketAssignment,
  processTicketAndSave,
  saveInferenceResult,
  determineReviewNeeds,
  buildFallbackResult,
  buildCategoryPrompt,
};
