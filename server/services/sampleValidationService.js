/**
 * 样本集管理与验证服务
 * 支持：样本创建、样本集管理、验证运行、指标对比、样本解释
 */
const fs = require('fs');
const path = require('path');
const { getDb } = require('../db');
const { uuid, now, parseJsonSafe, stringifyIfNeeded } = require('../utils/common');
const logger = require('../utils/logger');
const modelSvc = require('./modelService');
const extraction = require('./extractionService');
const audit = require('../audit');

const SAMPLES_DIR = path.resolve(__dirname, '../../data/samples');

function _ensureDir() {
  if (!fs.existsSync(SAMPLES_DIR)) fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

function createSample(opts) {
  const {
    meeting_title, project_name, meeting_date, transcript, segments,
    expected_action_items = [], expected_topics = [], expected_speakers = [],
    notes = null, tags = [],
  } = opts;

  _ensureDir();
  const id = uuid();
  const sample = {
    id,
    meeting_title: meeting_title || '',
    project_name: project_name || '',
    meeting_date: meeting_date || new Date().toISOString().slice(0, 10),
    transcript: transcript || '',
    segments: segments || (transcript ? [{ content: transcript, speaker: '' }] : []),
    expected_action_items,
    expected_topics,
    expected_speakers,
    notes,
    tags,
    created_at: now(),
  };

  fs.writeFileSync(path.join(SAMPLES_DIR, `${id}.json`), JSON.stringify(sample, null, 2));
  logger.info(`[samples] Created sample ${id}`);
  return sample;
}

function getSample(id) {
  const file = path.join(SAMPLES_DIR, `${id}.json`);
  if (!fs.existsSync(file)) return null;
  return parseJsonSafe(fs.readFileSync(file, 'utf8'), null);
}

function listSamples(opts = {}) {
  _ensureDir();
  const { tag = null, limit = 100, offset = 0 } = opts;
  const files = fs.readdirSync(SAMPLES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const samples = [];
  for (const fname of files) {
    try {
      const s = parseJsonSafe(fs.readFileSync(path.join(SAMPLES_DIR, fname), 'utf8'), null);
      if (s) {
        if (tag && (!s.tags || !s.tags.includes(tag))) continue;
        samples.push({
          id: s.id,
          meeting_title: s.meeting_title,
          project_name: s.project_name,
          action_item_count: (s.expected_action_items || []).length,
          tags: s.tags || [],
          created_at: s.created_at,
        });
      }
    } catch {}
  }
  return samples.slice(offset, offset + limit);
}

function updateSample(id, patch) {
  const sample = getSample(id);
  if (!sample) throw new Error('Sample not found');
  const merged = { ...sample, ...patch, updated_at: now() };
  fs.writeFileSync(path.join(SAMPLES_DIR, `${id}.json`), JSON.stringify(merged, null, 2));
  return merged;
}

function deleteSample(id) {
  const file = path.join(SAMPLES_DIR, `${id}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

function importSamplesFromJson(jsonArray, tag = 'imported') {
  const results = [];
  for (const entry of jsonArray) {
    try {
      const s = createSample({ ...entry, tags: [...(entry.tags || []), tag] });
      results.push({ id: s.id, success: true });
    } catch (err) {
      results.push({ id: null, success: false, error: err.message });
    }
  }
  return results;
}

/**
 * 使用指定模型对样本集进行验证推理
 */
async function validateDataset(modelId, datasetId, sampleIds, opts = {}) {
  const model = modelSvc.getModel(modelId);
  if (!model) throw new Error('Model not found');

  const run = modelSvc.createValidationRun(modelId, datasetId);

  const samples = sampleIds.map(getSample).filter(Boolean);
  const predictions = [];
  const groundTruth = [];

  for (const s of samples) {
    groundTruth.push({
      sample_id: s.id,
      action_items: s.expected_action_items || [],
      topics: s.expected_topics || [],
    });

    try {
      const pred = await extraction.extractActionItems({
        meetingTitle: s.meeting_title,
        projectName: s.project_name,
        meetingDate: s.meeting_date,
        segments: s.segments,
      }, { useModel: `${model.provider === 'openai' ? '' : ''}${model.name}` });

      predictions.push({
        sample_id: s.id,
        action_items: pred.action_items,
        topics: pred.topics,
      });
    } catch (err) {
      predictions.push({ sample_id: s.id, action_items: [], topics: [], error: err.message });
    }
  }

  const metrics = modelSvc.computeMetrics(predictions, groundTruth);
  metrics.predictions_summary = predictions.map(p => ({
    sample_id: p.sample_id,
    predicted_count: (p.action_items || []).length,
    error: p.error || null,
  }));
  metrics.ground_truth_summary = groundTruth.map(g => ({
    sample_id: g.sample_id,
    expected_count: (g.action_items || []).length,
  }));

  modelSvc.completeValidationRun(run.id, metrics);

  logger.info(`[validate] Run ${run.id} complete: F1=${metrics.overall.f1.toFixed(3)}, P=${metrics.overall.precision.toFixed(3)}, R=${metrics.overall.recall.toFixed(3)}`);

  return { runId: run.id, metrics, samples: predictions.length };
}

/**
 * 对单个样本生成对比解释（用于复核样本）
 */
async function explainSamplePrediction(sampleId, opts = {}) {
  const sample = getSample(sampleId);
  if (!sample) throw new Error('Sample not found');

  let prediction = opts.prediction;
  if (!prediction) {
    prediction = await extraction.extractActionItems({
      meetingTitle: sample.meeting_title,
      projectName: sample.project_name,
      meetingDate: sample.meeting_date,
      segments: sample.segments,
    }, opts);
  }

  const expected = sample.expected_action_items || [];
  const actual = prediction.action_items || [];

  const matched = [];
  const missed = [];
  const falsePositives = [];

  const usedIdx = new Set();
  for (const p of actual) {
    let bestMatch = null;
    let bestScore = 0;
    for (let i = 0; i < expected.length; i++) {
      if (usedIdx.has(i)) continue;
      const score = _titleSim(p.title, expected[i].title);
      if (score > bestScore) { bestScore = score; bestMatch = { idx: i, item: expected[i] }; }
    }

    if (bestMatch && bestScore >= 0.5) {
      usedIdx.add(bestMatch.idx);
      const diffs = [];
      if (p.assignee !== bestMatch.item.assignee) diffs.push({
        field: 'assignee',
        predicted: p.assignee,
        expected: bestMatch.item.assignee,
        predicted_pending: p.assignee_pending,
        correct: (p.assignee_pending && !bestMatch.item.assignee) || p.assignee === bestMatch.item.assignee,
      });
      if (p.deadline !== bestMatch.item.deadline) diffs.push({
        field: 'deadline',
        predicted: p.deadline,
        expected: bestMatch.item.deadline,
        predicted_pending: p.deadline_pending,
        correct: (p.deadline_pending && !bestMatch.item.deadline) || p.deadline === bestMatch.item.deadline,
      });
      if (Boolean(p.is_milestone) !== Boolean(bestMatch.item.is_milestone)) diffs.push({
        field: 'is_milestone',
        predicted: Boolean(p.is_milestone),
        expected: Boolean(bestMatch.item.is_milestone),
        correct: false,
      });
      matched.push({
        title_similarity: bestScore,
        predicted: p,
        expected: bestMatch.item,
        field_differences: diffs,
        all_fields_match: diffs.every(d => d.correct),
      });
    } else {
      falsePositives.push({
        predicted: p,
        review_suggestion: _suggestActionReview(p, sample),
      });
    }
  }
  for (let i = 0; i < expected.length; i++) {
    if (!usedIdx.has(i)) {
      missed.push({
        expected: expected[i],
        detection_hint: _hintWhyMissed(expected[i], sample),
      });
    }
  }

  return {
    sample: { id: sample.id, meeting_title: sample.meeting_title },
    summary: {
      expected_count: expected.length,
      predicted_count: actual.length,
      matched: matched.length,
      missed: missed.length,
      false_positives: falsePositives.length,
      perfectly_matched: matched.filter(m => m.all_fields_match).length,
    },
    matched_items: matched,
    missed_items: missed,
    false_positive_items: falsePositives,
  };
}

function _titleSim(a, b) {
  if (!a || !b) return 0;
  const sa = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const sb = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  return inter / (sa.size + sb.size - inter);
}

function _suggestActionReview(item, sample) {
  const reasons = [];
  if (item.assignee_pending) reasons.push('该预测负责人待确认，需人工复核');
  if (item.deadline_pending) reasons.push('该预测截止日期待确认，需人工复核');
  if (!item.is_milestone && (item.milestone_confidence || 0) >= 0.5) {
    reasons.push('存在一定里程碑置信度，建议复核是否为里程碑');
  }
  return reasons.length ? reasons : ['该行动项在标注中不存在，建议确认是否为误报'];
}

function _hintWhyMissed(expected, sample) {
  const hints = [];
  const allText = (sample.transcript || sample.segments?.map(s => s.content).join(' ') || '').toLowerCase();
  const keyWords = (expected.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 2);
  const found = keyWords.filter(w => allText.includes(w));
  if (found.length === 0) {
    hints.push('标题关键词均未在原文中出现，可能是样本标注或原文输入问题');
  } else if (found.length < keyWords.length / 2) {
    hints.push(`仅匹配到部分关键词 (${found.join(', ')})，可能表述差异较大`);
  }
  if (expected.assignee && !allText.includes(expected.assignee.toLowerCase())) {
    hints.push(`负责人 ${expected.assignee} 在原文中未出现，可能需要扩展指代匹配`);
  }
  if (hints.length === 0) hints.push('表述方式可能较为间接，需要更强的语义理解');
  return hints;
}

module.exports = {
  createSample,
  getSample,
  listSamples,
  updateSample,
  deleteSample,
  importSamplesFromJson,
  validateDataset,
  explainSamplePrediction,
};
