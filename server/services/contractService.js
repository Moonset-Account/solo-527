const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const models = require('../models');
const { sequelize } = require('../db/connection');
const config = require('../config');
const VectorStoreService = require('./vectorStoreService');
const AuditService = require('./auditService');
const AlertService = require('./alertService');
const RiskDetectionService = require('./riskDetectionService');
const DocumentExtractorService = require('./documentExtractorService');

const VALID_CLAUSE_TYPES = [
  'payment', 'breach', 'confidentiality', 'auto_renewal',
  'definition', 'obligation', 'termination', 'liability',
  'ip', 'dispute', 'force_majeure', 'other'
];

const VALID_RISK_TYPES = ['payment', 'breach', 'confidentiality', 'auto_renewal'];
const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];

class ContractService {
  constructor() {
    this._ensureUploadDir();
  }

  _ensureUploadDir() {
    const dir = path.resolve(config.server.uploadDir);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async uploadContract(fileData, metadata, userId, ip, options = {}) {
    const { originalname, buffer, size } = fileData;
    const {
      title, contract_number, contract_type, party_a, party_b,
      effective_date, expiry_date, description,
      pre_parsed_clauses, import_review_results,
    } = metadata;

    const ext = path.extname(originalname).toLowerCase();
    this._validateFileType(ext, size);

    const transaction = await sequelize.transaction();

    try {
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      const contract = await models.Contract.create({
        id: uuidv4(),
        title: title || originalname.replace(ext, ''),
        contract_number: contract_number || null,
        contract_type: contract_type || null,
        party_a: party_a || null,
        party_b: party_b || null,
        effective_date: effective_date ? new Date(effective_date) : null,
        expiry_date: expiry_date ? new Date(expiry_date) : null,
        description: description || null,
        uploader_id: userId,
        current_version: 1,
        status: 'processing',
      }, { transaction });

      const storageName = `${contract.id}_v1${ext}`;
      const storagePath = path.join(config.server.uploadDir, storageName);
      fs.writeFileSync(storagePath, buffer);

      const extractResult = await DocumentExtractorService.extractFromBuffer(
        buffer, ext, originalname, contract.id
      );
      const contentText = extractResult.text;

      const contractVersion = await models.ContractVersion.create({
        id: uuidv4(),
        contract_id: contract.id,
        version_number: 1,
        original_filename: originalname,
        storage_path: storagePath,
        file_size: size,
        file_hash: fileHash,
        content_text: contentText,
        change_summary: options.change_summary || '初始版本上传',
        created_by: userId,
        is_active: true,
      }, { transaction });

      let clauses;
      if (pre_parsed_clauses && pre_parsed_clauses.length > 0) {
        clauses = await this._importPreParsedClauses(
          contract.id, contractVersion.id, pre_parsed_clauses, transaction
        );
      } else {
        clauses = await this._parseAndCreateClauses(
          contract.id, contractVersion.id, contentText,
          extractResult.metadata, transaction
        );
      }

      if (import_review_results && import_review_results.length > 0) {
        await this._applyImportedReviewResults(
          contract.id, clauses, import_review_results, userId, transaction
        );
      }

      await transaction.commit();

      await AuditService.logContractUpload(contract, userId, ip);

      if (pre_parsed_clauses && pre_parsed_clauses.length > 0) {
        await AuditService.log('contract_update', 'clause', {
          entity_id: contractVersion.id,
          contract_id: contract.id,
          newValues: { imported_clauses_count: clauses.length },
          changeSummary: `批量导入 ${clauses.length} 条预解析条款`,
          user_id: userId,
        }, { userId, ip });
      }

      await AlertService.checkDataMissing(
        'contract', contract,
        ['party_a', 'party_b', 'effective_date'],
        contract.id, contract.id
      );

      setImmediate(async () => {
        try {
          const vectorIndex = await VectorStoreService.buildIndexForContract(
            contract.id, contractVersion.id, clauses, userId
          );

          await models.ContractVersion.update(
            { vector_index_version: vectorIndex.index_version },
            { where: { id: contractVersion.id } }
          );

          await RiskDetectionService.detectRisksForContract(
            contract.id, contractVersion.id, { userId, ip }
          );

          await contract.update({ status: 'reviewing' });
        } catch (e) {
          console.error('Post-processing failed:', e);
          await contract.update({ status: 'draft' });
        }
      });

      return {
        contract,
        version: contractVersion,
        clauses_count: clauses.length,
        extraction_metadata: {
          parser: extractResult.metadata.parser_used,
          warnings: extractResult.metadata.warnings,
          page_count: extractResult.metadata.page_count,
        },
        imported_clauses: pre_parsed_clauses?.length || 0,
        imported_reviews: import_review_results?.length || 0,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createNewVersion(contractId, fileData, metadata, userId, ip) {
    const { originalname, buffer, size } = fileData;
    const { change_summary, pre_parsed_clauses, import_review_results } = metadata;

    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    const ext = path.extname(originalname).toLowerCase();
    this._validateFileType(ext, size);

    const transaction = await sequelize.transaction();

    try {
      const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

      const existingHash = await models.ContractVersion.findOne({
        where: { contract_id: contractId, file_hash: fileHash },
      });
      if (existingHash) {
        throw new Error('该文件内容与已有版本相同，无需创建新版本');
      }

      const newVersionNum = contract.current_version + 1;

      await models.ContractVersion.update(
        { is_active: false },
        { where: { contract_id: contractId, is_active: true }, transaction }
      );

      const storageName = `${contractId}_v${newVersionNum}${ext}`;
      const storagePath = path.join(config.server.uploadDir, storageName);
      fs.writeFileSync(storagePath, buffer);

      const extractResult = await DocumentExtractorService.extractFromBuffer(
        buffer, ext, originalname, contractId
      );
      const contentText = extractResult.text;

      const newVersion = await models.ContractVersion.create({
        id: uuidv4(),
        contract_id: contractId,
        version_number: newVersionNum,
        original_filename: originalname,
        storage_path: storagePath,
        file_size: size,
        file_hash: fileHash,
        content_text: contentText,
        change_summary: change_summary || '上传新版本',
        created_by: userId,
        is_active: true,
      }, { transaction });

      let clauses;
      if (pre_parsed_clauses && pre_parsed_clauses.length > 0) {
        clauses = await this._importPreParsedClauses(
          contractId, newVersion.id, pre_parsed_clauses, transaction
        );
      } else {
        clauses = await this._parseAndCreateClauses(
          contractId, newVersion.id, contentText,
          extractResult.metadata, transaction
        );
      }

      if (import_review_results && import_review_results.length > 0) {
        await this._applyImportedReviewResults(
          contractId, clauses, import_review_results, userId, transaction
        );
      }

      await contract.update(
        { current_version: newVersionNum, status: 'processing' },
        { transaction }
      );

      await transaction.commit();

      await AuditService.log('contract_update', 'contract_version', {
        entity_id: newVersion.id,
        contract_id: contractId,
        newValues: { version: newVersionNum, change_summary },
        changeSummary: `创建新版本 v${newVersionNum}`,
        user_id: userId,
      }, { userId, ip });

      setImmediate(async () => {
        try {
          const vectorIndex = await VectorStoreService.buildIndexForContract(
            contractId, newVersion.id, clauses, userId
          );

          await models.ContractVersion.update(
            { vector_index_version: vectorIndex.index_version },
            { where: { id: newVersion.id } }
          );

          await RiskDetectionService.detectRisksForContract(
            contractId, newVersion.id, { userId, ip }
          );

          await contract.update({ status: 'reviewing' });
        } catch (e) {
          console.error('Version post-processing failed:', e);
        }
      });

      return {
        contract: { ...contract.toJSON(), current_version: newVersionNum },
        version: newVersion,
        clauses_count: clauses.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async rollbackToVersion(contractId, targetVersion, userId, ip) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    const targetVersionRecord = await models.ContractVersion.findOne({
      where: { contract_id: contractId, version_number: targetVersion },
    });

    if (!targetVersionRecord) {
      throw new Error(`目标版本 ${targetVersion} 不存在`);
    }

    if (!targetVersionRecord.vector_index_version) {
      throw new Error(`目标版本 ${targetVersion} 无对应的向量索引版本，无法回滚`);
    }

    const targetVectorIndex = await models.VectorIndexVersion.findOne({
      where: {
        contract_id: contractId,
        index_version: targetVersionRecord.vector_index_version,
      },
    });

    if (!targetVectorIndex) {
      throw new Error(`目标版本对应的向量索引 (v${targetVersionRecord.vector_index_version}) 不存在，无法完成回滚`);
    }
    if (targetVectorIndex.status !== 'ready') {
      throw new Error(`目标版本的向量索引状态为 ${targetVectorIndex.status}，非就绪状态不可回滚`);
    }

    const fromVersion = contract.current_version;

    const transaction = await sequelize.transaction();

    try {
      await models.ContractVersion.update(
        { is_active: false },
        { where: { contract_id: contractId, is_active: true }, transaction }
      );

      const newVersionNum = contract.current_version + 1;

      const rollbackVersion = await models.ContractVersion.create({
        id: uuidv4(),
        contract_id: contractId,
        version_number: newVersionNum,
        original_filename: targetVersionRecord.original_filename,
        storage_path: targetVersionRecord.storage_path,
        file_size: targetVersionRecord.file_size,
        file_hash: targetVersionRecord.file_hash,
        content_text: targetVersionRecord.content_text,
        vector_index_version: targetVersionRecord.vector_index_version,
        change_summary: `回滚到版本 ${targetVersion}`,
        created_by: userId,
        is_active: true,
        rollback_from_version: targetVersion,
      }, { transaction });

      const sourceClauses = await models.Clause.findAll({
        where: { contract_version_id: targetVersionRecord.id },
        raw: true,
      });

      if (sourceClauses.length === 0) {
        throw new Error(`目标版本 ${targetVersion} 无可回滚的条款数据`);
      }

      for (const clause of sourceClauses) {
        await models.Clause.create({
          ...clause,
          id: uuidv4(),
          contract_version_id: rollbackVersion.id,
          embedding_id: null,
        }, { transaction });
      }

      const vectorRollbackSuccess = await VectorStoreService.rollbackIndex(
        contractId, targetVersionRecord.vector_index_version, userId
      );
      if (!vectorRollbackSuccess) {
        throw new Error('向量索引切换失败，已中止回滚');
      }

      const activeAfterRollback = await models.VectorIndexVersion.findOne({
        where: { contract_id: contractId, is_active: true },
        attributes: ['index_version'],
        raw: true,
        transaction,
      });

      if (!activeAfterRollback || activeAfterRollback.index_version !== targetVersionRecord.vector_index_version) {
        throw new Error(`向量索引版本同步失败，预期v${targetVersionRecord.vector_index_version}，实际${activeAfterRollback?.index_version}`);
      }

      await contract.update(
        {
          current_version: newVersionNum,
          status: 'draft',
        },
        { transaction }
      );

      await transaction.commit();

      await AuditService.logContractRollback(contractId, fromVersion, targetVersion, userId, ip);
      await AuditService.log('vector_index_rollback', 'vector_index', {
        entity_id: targetVectorIndex.id,
        contract_id: contractId,
        newValues: { active_index_version: targetVersionRecord.vector_index_version },
        changeSummary: `同步切换向量索引到 v${targetVersionRecord.vector_index_version}`,
        user_id: userId,
      }, { userId, ip });

      return {
        new_version: newVersionNum,
        rolled_back_from: fromVersion,
        rolled_back_to: targetVersion,
        vector_index_version: targetVersionRecord.vector_index_version,
        clauses_restored: sourceClauses.length,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async importClauses(contractId, contractVersionId, importData, format, userId, ip) {
    const version = await models.ContractVersion.findOne({
      where: { id: contractVersionId, contract_id: contractId, is_active: true },
      include: [{ model: models.Contract, as: 'contract' }],
    });
    if (!version) throw new Error('合同版本不存在或非当前活跃版本');

    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    if (['approved', 'archived'].includes(contract.status)) {
      throw new Error('合同已通过或归档，不可再导入条款');
    }

    const parsedClauses = DocumentExtractorService.parseClauseImport(importData, format);
    if (parsedClauses.length === 0) {
      throw new Error('解析到 0 条有效条款，请检查导入文件格式');
    }

    const transaction = await sequelize.transaction();
    const { Op } = require('sequelize');
    try {
      const existingClauseIds = (await models.Clause.findAll({
        where: { contract_version_id: contractVersionId },
        attributes: ['id'],
        raw: true,
        transaction,
      })).map(c => c.id);

      if (existingClauseIds.length > 0) {
        await models.ReviewQueue.destroy({
          where: { clause_id: { [Op.in]: existingClauseIds } },
          transaction,
        });

        await models.RiskAnnotation.destroy({
          where: { clause_id: { [Op.in]: existingClauseIds } },
          transaction,
        });

        await models.Clause.destroy({
          where: { contract_version_id: contractVersionId },
          transaction,
        });
      }

      const createdClauses = await this._importPreParsedClauses(
        contractId, contractVersionId, parsedClauses, transaction
      );

      if (!version.vector_index_version || createdClauses.length > 0) {
        await models.ContractVersion.update(
          { vector_index_version: null },
          { where: { id: contractVersionId }, transaction }
        );
      }

      const humanRiskIds = await this._createHumanRiskAnnotationsFromImport(
        contractId, createdClauses, parsedClauses, userId, transaction
      );

      await transaction.commit();

      let clausesWithHistorical = 0;
      let clausesWithManualRisk = 0;
      for (const raw of parsedClauses) {
        if (raw.historical_notes && raw.historical_notes.trim()) clausesWithHistorical++;
        if (raw.manual_risk_type && VALID_RISK_TYPES.includes(raw.manual_risk_type)) clausesWithManualRisk++;
      }

      await AuditService.log('contract_update', 'clause', {
        entity_id: contractVersionId,
        contract_id: contractId,
        newValues: {
          count: createdClauses.length,
          format,
          with_historical_notes: clausesWithHistorical,
          with_manual_risk: clausesWithManualRisk,
        },
        changeSummary: `批量导入条款（${format}）：${createdClauses.length} 条` +
          (clausesWithHistorical > 0 ? `，其中 ${clausesWithHistorical} 条带历史意见` : '') +
          (clausesWithManualRisk > 0 ? `，${clausesWithManualRisk} 条预填人工标注风险` : ''),
        user_id: userId,
      }, { userId, ip });

      setImmediate(async () => {
        try {
          await AuditService.log('contract_update', 'vector_index', {
            entity_id: contractVersionId,
            contract_id: contractId,
            newValues: { clauses_count: createdClauses.length },
            changeSummary: '批量导入条款后，开始重建向量索引',
            user_id: userId,
          }, { userId, ip });

          const vectorIndex = await VectorStoreService.buildIndexForContract(
            contractId, contractVersionId, createdClauses, userId
          );

          await models.ContractVersion.update(
            { vector_index_version: vectorIndex.index_version },
            { where: { id: contractVersionId } }
          );

          await AuditService.log('contract_update', 'risk_annotation', {
            entity_id: contractVersionId,
            contract_id: contractId,
            newValues: { vector_index_version: vectorIndex.index_version },
            changeSummary: '向量索引构建完成，开始批量重跑AI风险检测（含历史意见上下文）',
            user_id: userId,
          }, { userId, ip });

          const detectionResult = await RiskDetectionService.detectRisksForContract(
            contractId, contractVersionId, { userId, ip }
          );

          await contract.update({ status: 'reviewing' });

          await AuditService.log('contract_update', 'risk_annotation', {
            entity_id: contractVersionId,
            contract_id: contractId,
            newValues: {
              risks_count: detectionResult.total_risks,
              clauses_analyzed: detectionResult.total,
              summary: detectionResult.summary,
            },
            changeSummary: `AI风险重检测完成：${detectionResult.total_risks} 条风险标注已生成，合同状态切换为reviewing`,
            user_id: userId,
          }, { userId, ip });
        } catch (e) {
          console.error('Post-import rebuild failed:', e);
          try {
            await AlertService.create({
              alert_type: 'service_failure',
              severity: 'error',
              title: '批量导入条款后处理失败',
              message: e.message,
              service_name: 'clause_import_postprocess',
              contract_id: contractId,
              error_stack: e.stack,
            }, { force: true });
          } catch (_) { /* ignore alert failures */ }
        }
      });

      return {
        imported: createdClauses.length,
        clauses: createdClauses.map(c => ({
          id: c.id,
          clause_number: c.clause_number,
          clause_title: c.clause_title,
          clause_type: c.clause_type,
          has_historical_notes: !!c.historical_notes,
          historical_notes_preview: c.historical_notes ? c.historical_notes.substring(0, 60) + '...' : null,
        })),
        with_historical_notes: clausesWithHistorical,
        with_manual_risk: clausesWithManualRisk,
        human_risk_annotations_created: humanRiskIds.length,
        human_risk_annotation_ids: humanRiskIds,
        post_processing: 'triggered',
        post_processing_detail:
          `已创建 ${humanRiskIds.length} 条人工标注风险；` +
          '向量索引重建 + 其余AI风险重检测已后台启动，请稍后刷新页面查看结果',
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async importReviewResults(contractId, importData, format, userId, ip) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    if (contract.status === 'approved') {
      throw new Error('合同已通过，不可导入复核结果');
    }

    const activeVersion = await models.ContractVersion.findOne({
      where: { contract_id: contractId, is_active: true },
    });
    if (!activeVersion) throw new Error('合同无活跃版本');

    const clauses = await models.Clause.findAll({
      where: { contract_version_id: activeVersion.id },
    });

    const parsedReviews = DocumentExtractorService.parseReviewImport(importData, format);
    if (parsedReviews.length === 0) {
      throw new Error('解析到 0 条有效复核结果，请检查导入文件格式');
    }

    const transaction = await sequelize.transaction();
    try {
      let applied = 0;
      let approved = 0;
      let modified = 0;
      let rejected = 0;
      let withNotes = 0;

      for (const review of parsedReviews) {
        let targetRisk = null;

        if (review.risk_id) {
          targetRisk = await models.RiskAnnotation.findByPk(review.risk_id, { transaction });
        }

        if (!targetRisk && (review.clause_number || review.clause_title)) {
          const matchedClause = clauses.find(c =>
            (review.clause_number && c.clause_number === review.clause_number) ||
            (review.clause_title && c.clause_title?.includes(review.clause_title))
          );
          if (matchedClause) {
            targetRisk = await models.RiskAnnotation.findOne({
              where: { clause_id: matchedClause.id, contract_id: contractId },
              order: [['created_at', 'DESC']],
              transaction,
            });
          }
        }

        if (!targetRisk) continue;

        const oldValues = {
          risk_type: targetRisk.risk_type,
          risk_level: targetRisk.risk_level,
          status: targetRisk.status,
          human_notes: targetRisk.human_notes,
        };

        const updates = {
          reviewed_by: userId,
          reviewed_at: review.reviewed_at || new Date(),
          review_status: 'completed',
          source: 'hybrid',
        };

        let changed = false;
        let actionApplied = 'noop';
        switch (review.action) {
          case 'approve':
          case 'approved':
            updates.status = 'approved';
            changed = true;
            approved++;
            actionApplied = 'approved';
            break;
          case 'reject':
          case 'rejected':
          case 'remove':
            updates.status = 'rejected';
            updates.is_overruled = true;
            changed = true;
            rejected++;
            actionApplied = 'rejected';
            break;
          case 'modify':
          case 'modified':
          default:
            if (review.final_risk_type && VALID_RISK_TYPES.includes(review.final_risk_type)) {
              updates.risk_type = review.final_risk_type;
              updates.human_risk_type = review.final_risk_type;
              changed = true;
            }
            if (review.final_risk_level && VALID_RISK_LEVELS.includes(review.final_risk_level)) {
              updates.risk_level = review.final_risk_level;
              updates.human_risk_level = review.final_risk_level;
              changed = true;
            }
            if (changed) {
              updates.status = 'modified';
              updates.is_overruled = true;
              modified++;
              actionApplied = 'modified';
            } else if (review.notes) {
              actionApplied = 'notes_only';
            }
            break;
        }

        if (review.notes) {
          updates.human_notes = review.notes;
          withNotes++;
        }

        if (changed || review.notes) {
          await targetRisk.update(updates, { transaction });
          applied++;

          if (['approved', 'rejected', 'modified'].includes(updates.status)) {
            const queueItem = await models.ReviewQueue.findOne({
              where: { risk_annotation_id: targetRisk.id },
              transaction,
            });
            if (queueItem && queueItem.status !== 'completed') {
              await queueItem.update({
                status: 'completed',
                completed_by: userId,
                completed_at: review.reviewed_at || new Date(),
                review_notes: (review.notes || '').substring(0, 500),
              }, { transaction });
            }
          }

          const importedData = {
            source_review_action: review.action,
            source_review_applied_as: actionApplied,
            source_review_reference: review.reference || review.clause_number || review.risk_id || 'unknown',
          };

          await AuditService.logRiskModify(
            targetRisk, oldValues, userId, ip,
            `[批量导入复核 ${review.action || 'apply'} → ${actionApplied}] ` +
            (review.notes ? `${review.notes.substring(0, 80)}` : '无备注'),
            importedData
          );
        }
      }

      await transaction.commit();

      try {
        const pending = await models.RiskAnnotation.count({
          where: { contract_id: contractId, status: ['pending_review', 'review_queue'] },
        });
        if (pending === 0 && contract.status === 'reviewing') {
          await AuditService.log('system_info', 'contract', {
            entity_id: contractId,
            contract_id: contractId,
            newValues: { imported_reviews: applied, pending_remaining: 0 },
            changeSummary: `批量导入复核结果后，全部风险标注均已完成人工复核（pending=0），可以通过合同`,
            user_id: userId,
          }, { userId, ip });
        }
      } catch (_) { /* ignore */ }

      return {
        total_parsed: parsedReviews.length,
        applied: applied,
        skipped: parsedReviews.length - applied,
        breakdown: { approved, modified, rejected, with_notes: withNotes },
        detail:
          approved > 0 ? `通过: ${approved}; ` : '' +
          modified > 0 ? `改标: ${modified}; ` : '' +
          rejected > 0 ? `移除: ${rejected}; ` : '' +
          withNotes > 0 ? `含备注: ${withNotes}` : '',
      };
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  }

  async getHistoricalContextForClause(clauseContent, clauseType, limit = 5) {
    const { Op } = require('sequelize');

    const reviewedRisks = await models.RiskAnnotation.findAll({
      where: {
        status: ['approved', 'modified', 'human_reviewed'],
        clause_id: { [Op.ne]: null },
        [Op.or]: [
          { source: { [Op.ne]: 'ai' } },
          { is_overruled: true },
          { reviewed_by: { [Op.ne]: null } },
        ],
      },
      include: [
        {
          model: models.Clause,
          where: VALID_RISK_TYPES.includes(clauseType) ? { clause_type: clauseType } : undefined,
          attributes: ['id', 'content', 'clause_number', 'clause_title', 'clause_type', 'historical_notes'],
          required: true,
        },
      ],
      order: [['reviewed_at', 'DESC'], ['created_at', 'DESC']],
      limit: 50,
    });

    const historicalContext = [];
    for (const risk of reviewedRisks.slice(0, limit)) {
      if (risk.Clause) {
        const ctx = {
          clause_id: risk.Clause.id,
          clause_number: risk.Clause.clause_number,
          clause_title: risk.Clause.clause_title,
          clause_type: risk.Clause.clause_type,
          clause_content: risk.Clause.content.substring(0, 500),
          original_risk_type: risk.getDataValue('risk_type'),
          final_risk_type: risk.human_risk_type || risk.getDataValue('risk_type'),
          final_risk_level: risk.human_risk_level || risk.getDataValue('risk_level'),
          review_result: risk.status,
          is_overruled: risk.is_overruled,
          human_notes: risk.human_notes || '',
          reviewer: risk.reviewed_by,
          reviewed_at: risk.reviewed_at,
          source: risk.source,
        };

        const snap = risk.getDataValue('ai_context_snapshot');
        if (snap && typeof snap === 'object') {
          const imp = snap.import_source_fields;
          if (imp && typeof imp === 'object') {
            ctx.imported_from = snap.imported_from || null;
            ctx.imported_manual_risk_type = imp.raw_manual_risk_type || null;
            ctx.imported_manual_risk_level = imp.raw_manual_risk_level || null;
            ctx.imported_manual_review_notes = imp.raw_manual_review_notes || null;
            ctx.imported_historical_notes_excerpt = imp.raw_historical_notes_excerpt || null;
            if (!ctx.human_notes && imp.raw_manual_review_notes) {
              ctx.human_notes = imp.raw_manual_review_notes;
            }
          }
          if (snap.model_returned_historical_reference_applied &&
              snap.model_returned_historical_reference_applied !== 'none') {
            ctx.previous_model_reference_applied = snap.model_returned_historical_reference_applied;
          }
        }

        if (risk.Clause.historical_notes) {
          ctx.clause_has_historical_notes = true;
          ctx.clause_historical_notes_excerpt = risk.Clause.historical_notes.substring(0, 300);
        }

        historicalContext.push(ctx);
      }
    }

    const withHistoricalNotes = await models.Clause.findAll({
      where: {
        historical_notes: { [Op.ne]: null },
        ...(VALID_RISK_TYPES.includes(clauseType) ? { clause_type: clauseType } : {}),
      },
      attributes: ['id', 'content', 'historical_notes', 'clause_type', 'clause_number', 'clause_title'],
      order: [['updated_at', 'DESC']],
      limit,
    });

    for (const c of withHistoricalNotes) {
      const alreadyAdded = historicalContext.some(h => h.clause_id === c.id && h.is_history_note);
      if (alreadyAdded) continue;
      historicalContext.push({
        clause_id: c.id,
        clause_number: c.clause_number,
        clause_title: c.clause_title,
        clause_type: c.clause_type,
        clause_content: c.content.substring(0, 500),
        historical_notes: c.historical_notes,
        is_history_note: true,
      });
    }

    return historicalContext;
  }

  async getContractVersions(contractId) {
    const versions = await models.ContractVersion.findAll({
      where: { contract_id: contractId },
      order: [['version_number', 'DESC']],
      include: [
        { model: models.User, as: 'creator', attributes: ['id', 'full_name', 'username'] },
      ],
    });

    return versions.map(v => ({
      ...v.toJSON(),
      storage_path: undefined,
    }));
  }

  async getContractWithDetails(contractId) {
    const contract = await models.Contract.findByPk(contractId, {
      include: [
        { model: models.User, as: 'uploader', attributes: ['id', 'full_name', 'username'] },
        { model: models.User, as: 'reviewer', attributes: ['id', 'full_name', 'username'] },
      ],
    });

    if (!contract) return null;

    const activeVersion = await models.ContractVersion.findOne({
      where: { contract_id: contractId, is_active: true },
    });

    const clauses = activeVersion ? await models.Clause.findAll({
      where: { contract_version_id: activeVersion.id },
      order: [['start_position', 'ASC']],
    }) : [];

    const risks = await RiskDetectionService.getAllRisksForContract(contractId);

    return {
      ...contract.toJSON(),
      active_version: activeVersion ? {
        ...activeVersion.toJSON(),
        storage_path: undefined,
      } : null,
      clauses,
      risks,
      risk_summary: RiskDetectionService._summarizeRisks(risks),
    };
  }

  async listContracts(options = {}) {
    const { Op } = require('sequelize');
    const {
      status, contract_type, uploader_id, reviewer_id,
      search, limit = 20, offset = 0,
    } = options;

    const where = {};
    if (status) where.status = status;
    if (contract_type) where.contract_type = contract_type;
    if (uploader_id) where.uploader_id = uploader_id;
    if (reviewer_id) where.reviewer_id = reviewer_id;
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { contract_number: { [Op.iLike]: `%${search}%` } },
        { party_a: { [Op.iLike]: `%${search}%` } },
        { party_b: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await models.Contract.findAndCountAll({
      where,
      order: [['updated_at', 'DESC']],
      limit, offset,
      include: [
        { model: models.User, as: 'uploader', attributes: ['id', 'full_name'] },
        { model: models.User, as: 'reviewer', attributes: ['id', 'full_name'] },
      ],
    });

    return {
      total: result.count,
      contracts: result.rows,
    };
  }

  async approveContract(contractId, userId, ip) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    const pendingRisks = await models.RiskAnnotation.count({
      where: {
        contract_id: contractId,
        status: ['pending_review', 'review_queue'],
      },
    });

    if (pendingRisks > 0) {
      throw new Error(`还有 ${pendingRisks} 条风险标注等待复核，无法通过合同。请先完成全部风险的人工复核。`);
    }

    const activeVersion = await models.ContractVersion.findOne({
      where: { contract_id: contractId, is_active: true },
    });
    if (!activeVersion) {
      throw new Error('合同无活跃版本');
    }

    const clauseCount = await models.Clause.count({
      where: { contract_version_id: activeVersion.id },
    });
    if (clauseCount === 0) {
      throw new Error('当前版本无条款数据，不可通过复核');
    }

    if (!activeVersion.vector_index_version) {
      await AlertService.create({
        alert_type: 'system_warning',
        severity: 'warning',
        title: '合同通过时无关联向量索引版本',
        message: `合同 ${contract.title} 通过时，活跃版本未绑定 vector_index_version`,
        service_name: 'contract_approve',
        contract_id: contractId,
      }, { force: false });
    }

    await contract.update({
      status: 'approved',
      reviewer_id: userId,
    });

    await AuditService.log('contract_approve', 'contract', {
      entity_id: contract.id,
      contract_id: contract.id,
      newValues: { status: 'approved', reviewer_id: userId },
      changeSummary: '合同复核通过，所有风险标注已完成人工确认',
      user_id: userId,
    }, { userId, ip });

    return contract;
  }

  async rejectContract(contractId, userId, ip, reason) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) throw new Error('合同不存在');

    await contract.update({
      status: 'rejected',
      reviewer_id: userId,
    });

    await AuditService.log('contract_reject', 'contract', {
      entity_id: contract.id,
      contract_id: contract.id,
      newValues: { status: 'rejected', reason },
      changeSummary: `合同被拒绝: ${reason || '未说明原因'}`,
      user_id: userId,
    }, { userId, ip });

    return contract;
  }

  _validateFileType(ext, size) {
    if (!config.server.allowedFileTypes.includes(ext)) {
      throw new Error(`不支持的文件类型: ${ext}。支持: ${config.server.allowedFileTypes.join(', ')}`);
    }
    if (size > config.server.maxFileSize) {
      throw new Error(`文件过大，最大允许 ${config.server.maxFileSize / 1024 / 1024}MB`);
    }
  }

  async _importPreParsedClauses(contractId, contractVersionId, rawClauses, transaction) {
    const clauses = [];
    let position = 0;

    for (let i = 0; i < rawClauses.length; i++) {
      const raw = rawClauses[i];
      if (!raw.content || !raw.content.trim()) continue;

      const clauseType = VALID_CLAUSE_TYPES.includes(raw.clause_type)
        ? raw.clause_type
        : (raw.clause_type ? this._classifyClauseType(raw.clause_type) : this._classifyClauseType(raw.content));

      const startPos = position;
      position += raw.content.length;

      const clause = await models.Clause.create({
        id: uuidv4(),
        contract_id: contractId,
        contract_version_id: contractVersionId,
        clause_number: raw.clause_number || `第${i + 1}条`,
        clause_title: (raw.clause_title || raw.content.substring(0, 60)).trim(),
        clause_type: clauseType,
        content: raw.content.trim(),
        start_position: startPos,
        end_position: position,
        page_number: raw.page_number || null,
        is_amended: !!raw.is_amended || raw.content.includes('修改') || raw.content.includes('变更'),
        historical_notes: raw.historical_notes || null,
      }, { transaction });

      clauses.push(clause);
    }

    return clauses;
  }

  async _createHumanRiskAnnotationsFromImport(contractId, createdClauses, rawClauses, userId, transaction) {
    const clauseLookup = new Map();
    createdClauses.forEach(c => {
      clauseLookup.set(c.clause_number, c);
      if (c.clause_title) clauseLookup.set(`title:${c.clause_title}`, c);
    });

    const createdIds = [];

    for (const raw of rawClauses) {
      if (!raw.manual_risk_type || !VALID_RISK_TYPES.includes(raw.manual_risk_type)) continue;

      let matchedClause = null;
      if (raw.clause_number && clauseLookup.has(raw.clause_number)) {
        matchedClause = clauseLookup.get(raw.clause_number);
      } else if (raw.clause_title) {
        for (const [key, val] of clauseLookup) {
          if (key.startsWith('title:') && key.includes(raw.clause_title)) {
            matchedClause = val;
            break;
          }
        }
      }
      if (!matchedClause) continue;

      const riskLevel = VALID_RISK_LEVELS.includes(raw.manual_risk_level)
        ? raw.manual_risk_level
        : 'medium';

      const snapshot = {
        clause: {
          clause_number: matchedClause.clause_number,
          clause_title: matchedClause.clause_title,
          clause_type: matchedClause.clause_type,
          has_historical_notes: !!matchedClause.historical_notes,
          historical_notes_excerpt: matchedClause.historical_notes
            ? matchedClause.historical_notes.substring(0, 200)
            : null,
        },
        imported_from: 'manual_risk_import',
        import_source_fields: {
          raw_manual_risk_type: raw.manual_risk_type,
          raw_manual_risk_level: raw.manual_risk_level,
          raw_manual_review_notes: raw.manual_review_notes || null,
          raw_historical_notes_excerpt: raw.historical_notes
            ? raw.historical_notes.substring(0, 200)
            : null,
        },
        total_historical_context_items: matchedClause.historical_notes ? 1 : 0,
        model_returned_historical_reference_applied: 'imported_manual',
      };

      const risk = await models.RiskAnnotation.create({
        id: uuidv4(),
        clause_id: matchedClause.id,
        contract_id: contractId,
        risk_type: raw.manual_risk_type,
        risk_level: riskLevel,
        human_risk_type: raw.manual_risk_type,
        human_risk_level: riskLevel,
        confidence_score: 1.0,
        is_low_confidence: false,
        ai_summary: `导入的人工标注风险（${raw.manual_risk_type}/${riskLevel}）` +
          (raw.manual_review_notes ? ` - 说明：${raw.manual_review_notes.substring(0, 200)}` : ''),
        ai_quoted_text: matchedClause.content.substring(0, 300),
        evidence_clause_ids: [],
        historical_context_ids: [],
        ai_context_snapshot: snapshot,
        source: 'human',
        status: 'approved',
        review_status: 'completed',
        is_overruled: true,
        human_notes: raw.manual_review_notes || null,
        reviewed_by: userId,
        reviewed_at: raw.manual_reviewed_at || new Date(),
      }, { transaction });

      createdIds.push(risk.id);
    }

    return createdIds;
  }

  async _applyImportedReviewResults(contractId, clauses, reviewResults, userId, transaction) {
    const clauseMap = new Map();
    clauses.forEach(c => {
      clauseMap.set(c.clause_number, c);
      if (c.clause_title) clauseMap.set(`title:${c.clause_title}`, c);
    });

    for (const review of reviewResults) {
      let matchedClause = null;
      if (review.clause_number && clauseMap.has(review.clause_number)) {
        matchedClause = clauseMap.get(review.clause_number);
      } else if (review.clause_title) {
        for (const [key, val] of clauseMap) {
          if (key.startsWith('title:') && key.includes(review.clause_title)) {
            matchedClause = val;
            break;
          }
        }
      }
      if (!matchedClause) continue;

      if (review.manual_risk_type && VALID_RISK_TYPES.includes(review.manual_risk_type)) {
        await models.RiskAnnotation.create({
          id: uuidv4(),
          clause_id: matchedClause.id,
          contract_id: contractId,
          risk_type: review.manual_risk_type,
          risk_level: VALID_RISK_LEVELS.includes(review.manual_risk_level) ? review.manual_risk_level : 'medium',
          confidence_score: 1.0,
          is_low_confidence: false,
          ai_summary: '根据导入的人工标注生成',
          ai_quoted_text: matchedClause.content.substring(0, 200),
          source: 'human',
          status: 'human_reviewed',
          review_status: 'completed',
          reviewed_by: userId,
          reviewed_at: review.reviewed_at || new Date(),
          human_notes: review.manual_review_notes || null,
        }, { transaction });
      }
    }
  }

  async _parseAndCreateClauses(contractId, contractVersionId, contentText, metadata, transaction) {
    const rawClauses = this._splitIntoClauses(contentText);

    const pages = metadata?.pages || [];
    const clauses = [];
    let position = 0;

    for (let i = 0; i < rawClauses.length; i++) {
      const raw = rawClauses[i];
      const clauseType = this._classifyClauseType((raw.title || '') + ' ' + raw.content);
      const startPos = contentText.indexOf(raw.content, position);
      position = startPos >= 0 ? startPos + raw.content.length : position;

      let pageNumber = null;
      if (pages.length > 0) {
        for (let p = 0; p < pages.length; p++) {
          if (startPos >= 0 && startPos < (p + 1) * 2000) {
            pageNumber = p + 1;
            break;
          }
        }
      }

      const clause = await models.Clause.create({
        id: uuidv4(),
        contract_id: contractId,
        contract_version_id: contractVersionId,
        clause_number: raw.number || `第${i + 1}条`,
        clause_title: raw.title?.substring(0, 100) || raw.content.substring(0, 60),
        clause_type: clauseType,
        content: raw.content,
        start_position: startPos >= 0 ? startPos : null,
        end_position: startPos >= 0 ? startPos + raw.content.length : null,
        page_number: pageNumber,
        is_amended: raw.content.includes('修改') || raw.content.includes('变更'),
        historical_notes: null,
      }, { transaction });

      clauses.push(clause);
    }

    return clauses;
  }

  _splitIntoClauses(text) {
    const lines = text.split(/\n+/);
    const patterns = [
      /^第([一二三四五六七八九十百千零\d]+)[条章节编篇部]\s*/,
      /^(\d+(?:\.\d+)*)[\.\)、]\s*/,
      /^([（(][一二三四五六七八九十\d]+[）)])\s*/,
      /^([一二三四五六七八九十]+)[、.．\s]/,
    ];
    const clauses = [];
    let current = null;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      let matched = false;
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          if (current) clauses.push(current);
          current = {
            number: match[1],
            title: line.replace(pattern, '').split(/[。：；\.]/)[0].trim().substring(0, 100),
            content: line,
          };
          matched = true;
          break;
        }
      }

      if (!matched && current) {
        current.content += '\n' + line;
      } else if (!matched && !current) {
        current = {
          number: '',
          title: line.substring(0, 50),
          content: line,
        };
      }
    }

    if (current) clauses.push(current);

    return clauses.map(c => ({
      ...c,
      content: c.content.trim(),
    })).filter(c => c.content.length > 10);
  }

  _classifyClauseType(text) {
    const typeRules = {
      payment: ['付款', '支付', '价款', '报酬', '费用', '违约金', '逾期利息', '账款', '结算'],
      breach: ['违约', '赔偿', '损失', '罚则', '责任', '补救', '追偿'],
      confidentiality: ['保密', '秘密', '披露', '泄露', '信息', '专有', '商业秘密'],
      auto_renewal: ['自动续', '续约', '延期', '续期', '顺延', '自动延长'],
      termination: ['终止', '解除', '结束', '提前结束', '提前终止'],
      liability: ['责任', '承担', '连带', '限额', '豁免', '免责'],
      ip: ['知识产权', '专利', '商标', '著作权', '版权', '许可', '技术秘密'],
      dispute: ['争议', '管辖', '诉讼', '仲裁', '法院', '起诉'],
      force_majeure: ['不可抗力', '意外事件', '免责事由'],
      obligation: ['义务', '履行', '承诺', '保证', '应当'],
      definition: ['定义', '解释', '本合同所称', '系指', '是指'],
    };

    let bestType = 'other';
    let bestScore = 0;

    for (const [type, keywords] of Object.entries(typeRules)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += 1;
      }
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }

    return bestScore >= 1 ? bestType : 'other';
  }
}

module.exports = new ContractService();
