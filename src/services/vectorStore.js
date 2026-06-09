const fs = require('fs');
const path = require('path');
const { similarity } = require('ml-distance');
const config = require('../config');
const logger = require('../utils/logger');
const { getDb } = require('../utils/database');
const { createEmbedding, createBatchEmbeddings } = require('./openaiClient');

const INDEX_PATH = path.join(config.database.vectorDir, 'historical-index.json');
const META_PATH = path.join(config.database.vectorDir, 'historical-meta.json');

let indexCache = null;
let metaCache = null;

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function loadIndex() {
  if (indexCache) return { index: indexCache, meta: metaCache };
  try {
    if (fs.existsSync(INDEX_PATH) && fs.existsSync(META_PATH)) {
      indexCache = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf-8'));
      metaCache = JSON.parse(fs.readFileSync(META_PATH, 'utf-8'));
      logger.info(`Vector index loaded: ${indexCache.length} records`);
    } else {
      indexCache = [];
      metaCache = { builtAt: null, count: 0, dimension: 1536 };
    }
  } catch (error) {
    logger.error('Failed to load vector index', { error: error.message });
    indexCache = [];
    metaCache = { builtAt: null, count: 0, dimension: 1536 };
  }
  return { index: indexCache, meta: metaCache };
}

function saveIndex(index, meta) {
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index), 'utf-8');
  fs.writeFileSync(META_PATH, JSON.stringify({ ...meta, builtAt: new Date().toISOString(), count: index.length }), 'utf-8');
  indexCache = index;
  metaCache = { ...meta, builtAt: new Date().toISOString(), count: index.length };
  logger.info(`Vector index saved: ${index.length} records`);
}

function clearIndexCache() {
  indexCache = null;
  metaCache = null;
}

async function buildIndexFromDatabase(batchSize = 50) {
  const db = getDb();
  const rows = db.prepare(`
    SELECT id, ticket_no, content, category, urgency, department_code, department_name,
           district, block, community, resolution, resolution_days, followup_score
    FROM historical_tickets
    WHERE LENGTH(content) >= 10
  `).all();

  logger.info(`Building index: ${rows.length} candidates from DB`);

  const newIndex = [];
  let processed = 0;
  let totalTokens = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const texts = batch.map(r => `【${r.category || '未分类'}】${r.content}${r.resolution ? `【处理结果】${r.resolution}` : ''}`);
    try {
      const { vectors, tokens } = await createBatchEmbeddings(texts);
      totalTokens += tokens;
      batch.forEach((row, j) => {
        newIndex.push({
          id: row.id,
          ticket_no: row.ticket_no,
          vector: vectors[j],
          meta: {
            category: row.category,
            urgency: row.urgency,
            department_code: row.department_code,
            department_name: row.department_name,
            district: row.district,
            block: row.block,
            community: row.community,
            resolution: row.resolution,
            resolution_days: row.resolution_days,
            followup_score: row.followup_score,
          },
        });
      });
      processed += batch.length;
      logger.info(`Index progress: ${processed}/${rows.length}`);
    } catch (error) {
      logger.error(`Batch embedding failed at offset ${i}`, { error: error.message });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  saveIndex(newIndex, { dimension: 1536, source: 'historical_tickets', totalTokens });
  return { indexed: newIndex.length, totalTokens };
}

async function addToIndex(record) {
  const { index } = loadIndex();
  const text = `【${record.category || '未分类'}】${record.content}${record.resolution ? `【处理结果】${record.resolution}` : ''}`;
  const { vector } = await createEmbedding(text);
  index.push({
    id: record.id,
    ticket_no: record.ticket_no,
    vector,
    meta: {
      category: record.category,
      urgency: record.urgency,
      department_code: record.department_code,
      department_name: record.department_name,
      district: record.district,
      block: record.block,
      community: record.community,
      resolution: record.resolution,
    },
  });
  saveIndex(index, metaCache || {});
  return true;
}

async function searchSimilar(text, options = {}) {
  const topK = options.topK || config.thresholds.similarTicketsTopK;
  const categoryFilter = options.categoryFilter || null;
  const minScore = options.minScore || 0.5;

  const { index } = loadIndex();
  if (index.length === 0) {
    return { results: [], total: 0, indexSize: 0 };
  }

  const { vector: queryVec } = await createEmbedding(text);

  const scored = [];
  for (const item of index) {
    if (categoryFilter && item.meta.category !== categoryFilter) continue;
    const score = cosineSim(queryVec, item.vector);
    if (score >= minScore) {
      scored.push({ ...item, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, topK).map(s => ({
    id: s.id,
    ticket_no: s.ticket_no,
    score: Number(s.score.toFixed(4)),
    category: s.meta.category,
    urgency: s.meta.urgency,
    department_code: s.meta.department_code,
    department_name: s.meta.department_name,
    district: s.meta.district,
    resolution: s.meta.resolution,
    resolution_days: s.meta.resolution_days,
    followup_score: s.meta.followup_score,
  }));

  return { results: top, total: scored.length, indexSize: index.length };
}

function getIndexStats() {
  const { index, meta } = loadIndex();
  const categoryDist = {};
  for (const item of index) {
    const c = item.meta.category || '未分类';
    categoryDist[c] = (categoryDist[c] || 0) + 1;
  }
  return {
    total: index.length,
    builtAt: meta.builtAt,
    dimension: meta.dimension,
    categoryDistribution: categoryDist,
  };
}

module.exports = {
  loadIndex,
  saveIndex,
  clearIndexCache,
  buildIndexFromDatabase,
  addToIndex,
  searchSimilar,
  getIndexStats,
  cosineSim,
};
