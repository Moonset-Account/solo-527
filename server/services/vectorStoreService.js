const { v4: uuidv4 } = require('uuid');
const models = require('../models');
const { sequelize } = require('../db/connection');
const config = require('../config');
const OpenAIService = require('./openaiService');
const AlertService = require('./alertService');

class VectorStoreService {
  constructor() {
    this._inMemoryStore = new Map();
    this._initPGVectorSupport();
  }

  async _initPGVectorSupport() {
    try {
      const result = await sequelize.query(
        "SELECT installed_version FROM pg_available_extensions WHERE name = 'vector'",
        { type: sequelize.QueryTypes.SELECT }
      );
      this.usePGVector = result.length > 0 && result[0].installed_version;
      if (this.usePGVector) {
        console.log('Using PGVector for vector storage');
        await this._ensureVectorTable();
      } else {
        console.log('PGVector not available, using in-memory fallback');
        this.usePGVector = false;
      }
    } catch (e) {
      console.log('Using in-memory vector store fallback');
      this.usePGVector = false;
    }
  }

  async _ensureVectorTable() {
    try {
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS clause_vectors (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          clause_id UUID NOT NULL REFERENCES clauses(id) ON DELETE CASCADE,
          contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
          contract_version_id UUID NOT NULL REFERENCES contract_versions(id) ON DELETE CASCADE,
          vector_index_version INTEGER NOT NULL,
          embedding vector(${config.vector.dimension}),
          clause_type VARCHAR(50),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_clause_vectors_contract_version
        ON clause_vectors (contract_id, vector_index_version);
      `);

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_clause_vectors_clause_id
        ON clause_vectors (clause_id);
      `);
    } catch (e) {
      console.warn('Failed to create vector table, using fallback:', e.message);
      this.usePGVector = false;
    }
  }

  async buildIndexForContract(contractId, contractVersionId, clauses, userId) {
    const startTime = Date.now();
    const existingIndex = await models.VectorIndexVersion.findOne({
      where: { contract_id: contractId, is_active: true },
    });

    const newVersion = existingIndex ? existingIndex.index_version + 1 : 1;
    const indexName = `contract_${contractId}_v${newVersion}`;

    const indexRecord = await models.VectorIndexVersion.create({
      id: uuidv4(),
      contract_id: contractId,
      contract_version_id: contractVersionId,
      index_version: newVersion,
      index_name: indexName,
      embedding_model: config.openai.embeddingModel,
      embedding_dimension: config.vector.dimension,
      total_vectors: clauses.length,
      status: 'building',
      is_active: false,
      build_started_at: new Date(),
      created_by: userId,
    });

    try {
      const texts = clauses.map(c => `${c.clause_title || ''}\n${c.content}`);
      const embeddings = await OpenAIService.createEmbeddings(texts);

      if (this.usePGVector) {
        await this._saveToPGVector(contractId, contractVersionId, clauses, embeddings, newVersion);
      } else {
        this._saveToInMemory(indexName, clauses, embeddings);
      }

      const buildDuration = Date.now() - startTime;

      if (existingIndex) {
        await models.VectorIndexVersion.update(
          { is_active: false },
          { where: { contract_id: contractId, is_active: true } }
        );
      }

      await indexRecord.update({
        status: 'ready',
        is_active: true,
        build_completed_at: new Date(),
        build_duration_ms: buildDuration,
      });

      return indexRecord;
    } catch (error) {
      await indexRecord.update({
        status: 'failed',
        error_message: error.message,
        build_completed_at: new Date(),
        build_duration_ms: Date.now() - startTime,
      });

      await AlertService.create({
        alert_type: 'service_failure',
        severity: 'error',
        title: '向量索引构建失败',
        message: error.message,
        service_name: 'vector_store',
        contract_id: contractId,
        entity_type: 'vector_index',
        entity_id: indexRecord.id,
        error_stack: error.stack,
      });

      throw error;
    }
  }

  async semanticSearch(contractId, queryText, options = {}) {
    const {
      topK = config.vector.searchLimit,
      riskTypes = null,
      clauseTypes = null,
      minSimilarity = 0.5,
    } = options;

    const activeIndex = await models.VectorIndexVersion.findOne({
      where: { contract_id: contractId, is_active: true, status: 'ready' },
    });

    if (!activeIndex) {
      return [];
    }

    const queryEmbedding = await OpenAIService.createEmbedding(queryText);

    let results;
    if (this.usePGVector) {
      results = await this._searchPGVector(
        contractId,
        activeIndex.index_version,
        queryEmbedding,
        topK,
        clauseTypes
      );
    } else {
      results = await this._searchInMemory(
        activeIndex.index_name,
        queryEmbedding,
        topK,
        clauseTypes
      );
    }

    results = results.filter(r => r.similarity >= minSimilarity);

    return results;
  }

  async searchAcrossContracts(queryText, options = {}) {
    const {
      topK = 10,
      contractIds = null,
      clauseTypes = null,
      minSimilarity = 0.6,
    } = options;

    const queryEmbedding = await OpenAIService.createEmbedding(queryText);
    let allResults = [];

    const whereClause = { is_active: true, status: 'ready' };
    if (contractIds) whereClause.contract_id = contractIds;

    const activeIndexes = await models.VectorIndexVersion.findAll({ where: whereClause });

    for (const index of activeIndexes) {
      let results;
      if (this.usePGVector) {
        results = await this._searchPGVector(
          index.contract_id,
          index.index_version,
          queryEmbedding,
          Math.ceil(topK / activeIndexes.length),
          clauseTypes
        );
      } else {
        results = await this._searchInMemory(
          index.index_name,
          queryEmbedding,
          Math.ceil(topK / activeIndexes.length),
          clauseTypes
        );
      }
      allResults = allResults.concat(results);
    }

    return allResults
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  async rollbackIndex(contractId, targetVersion, userId) {
    const targetIndex = await models.VectorIndexVersion.findOne({
      where: {
        contract_id: contractId,
        index_version: targetVersion,
        status: 'ready',
      },
    });

    if (!targetIndex) {
      throw new Error(`目标版本 ${targetVersion} 的向量索引不存在或不可用`);
    }

    await models.VectorIndexVersion.update(
      { is_active: false },
      { where: { contract_id: contractId, is_active: true } }
    );

    await targetIndex.update({ is_active: true });

    return targetIndex;
  }

  async getIndexHistory(contractId) {
    return models.VectorIndexVersion.findAll({
      where: { contract_id: contractId },
      order: [['index_version', 'DESC']],
      include: [
        { model: models.User, as: 'creator', attributes: ['id', 'full_name'] },
      ],
    });
  }

  async _saveToPGVector(contractId, contractVersionId, clauses, embeddings, version) {
    const values = clauses.map((clause, idx) => {
      const vecStr = `[${embeddings[idx].join(',')}]`;
      return {
        id: uuidv4(),
        clause_id: clause.id,
        contract_id: contractId,
        contract_version_id: contractVersionId,
        vector_index_version: version,
        embedding: sequelize.literal(`'${vecStr}'::vector`),
        clause_type: clause.clause_type,
        metadata: { clause_number: clause.clause_number, page_number: clause.page_number },
      };
    });

    const placeholders = values.map((_, i) => `(
      $${i * 8 + 1}::UUID, $${i * 8 + 2}::UUID, $${i * 8 + 3}::UUID, $${i * 8 + 4}::UUID,
      $${i * 8 + 5}::INTEGER, $${i * 8 + 6}::vector, $${i * 8 + 7}::VARCHAR, $${i * 8 + 8}::JSONB
    )`).join(',');

    const params = [];
    values.forEach(v => {
      params.push(v.id, v.clause_id, v.contract_id, v.contract_version_id,
        v.vector_index_version, v.embedding.val, v.clause_type, JSON.stringify(v.metadata));
    });

    await sequelize.query(`
      INSERT INTO clause_vectors
      (id, clause_id, contract_id, contract_version_id, vector_index_version, embedding, clause_type, metadata)
      VALUES ${placeholders}
    `, { bind: params });
  }

  _saveToInMemory(indexName, clauses, embeddings) {
    const vectors = clauses.map((clause, idx) => ({
      clause_id: clause.id,
      clause_type: clause.clause_type,
      content: clause.content,
      embedding: embeddings[idx],
      metadata: { clause_number: clause.clause_number, clause_title: clause.clause_title },
    }));
    this._inMemoryStore.set(indexName, vectors);
  }

  async _searchPGVector(contractId, indexVersion, queryEmbedding, topK, clauseTypes) {
    const vecStr = `[${queryEmbedding.join(',')}]`;
    let typeFilter = '';
    const params = [contractId, indexVersion, vecStr, topK];

    if (clauseTypes && clauseTypes.length > 0) {
      typeFilter = `AND clause_type IN (${clauseTypes.map((_, i) => `$${i + 5}`).join(',')})`;
      params.push(...clauseTypes);
    }

    const results = await sequelize.query(`
      SELECT
        cv.clause_id,
        cv.clause_type,
        c.content,
        c.clause_title,
        c.clause_number,
        cv.metadata,
        (1 - (cv.embedding <=> $3::vector))::float AS similarity
      FROM clause_vectors cv
      JOIN clauses c ON c.id = cv.clause_id
      WHERE cv.contract_id = $1::UUID
        AND cv.vector_index_version = $2::INTEGER
        ${typeFilter}
      ORDER BY cv.embedding <=> $3::vector
      LIMIT $4::INTEGER
    `, { bind: params, type: sequelize.QueryTypes.SELECT });

    return results.map(r => ({
      clause_id: r.clause_id,
      clause_type: r.clause_type,
      content: r.content,
      clause_title: r.clause_title,
      clause_number: r.clause_number,
      similarity: r.similarity,
      metadata: r.metadata,
    }));
  }

  async _searchInMemory(indexName, queryEmbedding, topK, clauseTypes) {
    if (!this._inMemoryStore.has(indexName)) {
      return [];
    }

    const vectors = this._inMemoryStore.get(indexName);
    const filtered = clauseTypes
      ? vectors.filter(v => clauseTypes.includes(v.clause_type))
      : vectors;

    const scored = filtered.map(v => ({
      clause_id: v.clause_id,
      clause_type: v.clause_type,
      content: v.content,
      clause_title: v.metadata.clause_title,
      clause_number: v.metadata.clause_number,
      similarity: this._cosineSimilarity(queryEmbedding, v.embedding),
      metadata: v.metadata,
    }));

    return scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  _cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return normA > 0 && normB > 0 ? dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  }
}

module.exports = new VectorStoreService();
