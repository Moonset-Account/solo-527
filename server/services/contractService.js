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

  async uploadContract(fileData, metadata, userId, ip) {
    const { originalname, buffer, size, mimetype } = fileData;
    const { title, contract_number, contract_type, party_a, party_b, effective_date, expiry_date, description } = metadata;

    const ext = path.extname(originalname).toLowerCase();
    if (!config.server.allowedFileTypes.includes(ext)) {
      throw new Error(`不支持的文件类型: ${ext}。支持类型: ${config.server.allowedFileTypes.join(', ')}`);
    }

    if (size > config.server.maxFileSize) {
      throw new Error(`文件过大，最大允许: ${config.server.maxFileSize / 1024 / 1024}MB`);
    }

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

      const contentText = await this._extractText(buffer, ext);

      const contractVersion = await models.ContractVersion.create({
        id: uuidv4(),
        contract_id: contract.id,
        version_number: 1,
        original_filename: originalname,
        storage_path: storagePath,
        file_size: size,
        file_hash: fileHash,
        content_text: contentText,
        change_summary: '初始版本上传',
        created_by: userId,
        is_active: true,
      }, { transaction });

      const clauses = await this._parseAndCreateClauses(
        contract.id,
        contractVersion.id,
        contentText,
        transaction
      );

      await transaction.commit();

      await AuditService.logContractUpload(contract, userId, ip);

      await AlertService.checkDataMissing(
        'contract',
        contract,
        ['party_a', 'party_b', 'effective_date'],
        contract.id,
        contract.id
      );

      setImmediate(async () => {
        try {
          await VectorStoreService.buildIndexForContract(
            contract.id,
            contractVersion.id,
            clauses,
            userId
          );

          await RiskDetectionService.detectRisksForContract(
            contract.id,
            contractVersion.id,
            { userId, ip }
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
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async createNewVersion(contractId, fileData, metadata, userId, ip) {
    const { originalname, buffer, size } = fileData;
    const { change_summary } = metadata;

    const contract = await models.Contract.findByPk(contractId);
    if (!contract) {
      throw new Error('合同不存在');
    }

    const transaction = await sequelize.transaction();

    try {
      const ext = path.extname(originalname).toLowerCase();
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

      const contentText = await this._extractText(buffer, ext);

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

      const clauses = await this._parseAndCreateClauses(
        contractId,
        newVersion.id,
        contentText,
        transaction
      );

      await contract.update(
        {
          current_version: newVersionNum,
          status: 'processing',
        },
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
          await VectorStoreService.buildIndexForContract(
            contractId, newVersion.id, clauses, userId
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
    if (!contract) {
      throw new Error('合同不存在');
    }

    const targetVersionRecord = await models.ContractVersion.findOne({
      where: { contract_id: contractId, version_number: targetVersion },
    });

    if (!targetVersionRecord) {
      throw new Error(`目标版本 ${targetVersion} 不存在`);
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

      for (const clause of sourceClauses) {
        await models.Clause.create({
          ...clause,
          id: uuidv4(),
          contract_version_id: rollbackVersion.id,
          embedding_id: null,
        }, { transaction });
      }

      await contract.update(
        {
          current_version: newVersionNum,
          status: 'draft',
        },
        { transaction }
      );

      if (targetVersionRecord.vector_index_version) {
        await VectorStoreService.rollbackIndex(
          contractId,
          targetVersionRecord.vector_index_version,
          userId
        );
      }

      await transaction.commit();

      await AuditService.logContractRollback(contractId, fromVersion, targetVersion, userId, ip);

      return {
        new_version: newVersionNum,
        rolled_back_from: fromVersion,
        rolled_back_to: targetVersion,
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
      active_version: activeVersion,
      clauses,
      risks,
      risk_summary: RiskDetectionService._summarizeRisks(risks),
    };
  }

  async listContracts(options = {}) {
    const {
      status,
      contract_type,
      uploader_id,
      reviewer_id,
      has_risks,
      search,
      limit = 20,
      offset = 0,
    } = options;

    const where = {};
    if (status) where.status = status;
    if (contract_type) where.contract_type = contract_type;
    if (uploader_id) where.uploader_id = uploader_id;
    if (reviewer_id) where.reviewer_id = reviewer_id;
    if (search) {
      where[require('sequelize').Op.or] = [
        { title: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { contract_number: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { party_a: { [require('sequelize').Op.iLike]: `%${search}%` } },
        { party_b: { [require('sequelize').Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await models.Contract.findAndCountAll({
      where,
      order: [['updated_at', 'DESC']],
      limit,
      offset,
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
    if (!contract) {
      throw new Error('合同不存在');
    }

    const pendingRisks = await models.RiskAnnotation.count({
      where: {
        contract_id: contractId,
        status: ['pending_review', 'review_queue'],
      },
    });

    if (pendingRisks > 0) {
      throw new Error(`还有 ${pendingRisks} 条风险标注等待复核，无法通过合同`);
    }

    await contract.update({
      status: 'approved',
      reviewer_id: userId,
    });

    await AuditService.log('contract_approve', 'contract', {
      entity_id: contract.id,
      contract_id: contract.id,
      newValues: { status: 'approved', reviewer_id: userId },
      changeSummary: '合同复核通过',
      user_id: userId,
    }, { userId, ip });

    return contract;
  }

  async rejectContract(contractId, userId, ip, reason) {
    const contract = await models.Contract.findByPk(contractId);
    if (!contract) {
      throw new Error('合同不存在');
    }

    await contract.update({
      status: 'rejected',
      reviewer_id: userId,
    });

    await AuditService.log('contract_reject', 'contract', {
      entity_id: contract.id,
      contract_id: contract.id,
      newValues: { status: 'rejected', reason },
      changeSummary: `合同被拒绝: ${reason || ''}`,
      user_id: userId,
    }, { userId, ip });

    return contract;
  }

  async _extractText(buffer, ext) {
    if (ext === '.txt') {
      return buffer.toString('utf-8');
    }

    if (ext === '.md') {
      return buffer.toString('utf-8');
    }

    return buffer.toString('utf-8');
  }

  async _parseAndCreateClauses(contractId, contractVersionId, contentText, transaction) {
    const clausePatterns = this._getClausePatterns();
    const rawClauses = this._splitIntoClauses(contentText, clausePatterns);

    const clauses = [];
    let position = 0;

    for (const raw of rawClauses) {
      const clauseType = this._classifyClauseType(raw.title + ' ' + raw.content);
      const startPos = contentText.indexOf(raw.content, position);
      position = startPos >= 0 ? startPos + raw.content.length : position;

      const clause = await models.Clause.create({
        id: uuidv4(),
        contract_id: contractId,
        contract_version_id: contractVersionId,
        clause_number: raw.number,
        clause_title: raw.title,
        clause_type: clauseType,
        content: raw.content,
        start_position: startPos >= 0 ? startPos : null,
        end_position: startPos >= 0 ? startPos + raw.content.length : null,
        is_amended: raw.content.includes('修改') || raw.content.includes('变更'),
        historical_notes: null,
      }, { transaction });

      clauses.push(clause);
    }

    return clauses;
  }

  _getClausePatterns() {
    return [
      /^第([一二三四五六七八九十百千零\d]+)[条章节编篇部]/,
      /^(\d+(?:\.\d+)*)[\.\)、]\s*/,
      /^([（(][一二三四五六七八九十\d]+[）)])\s*/,
    ];
  }

  _splitIntoClauses(text, patterns) {
    const lines = text.split(/\n+/);
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
            title: line.replace(pattern, '').split(/[。：；]/)[0].trim().substring(0, 100),
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
      payment: ['付款', '支付', '金额', '价款', '报酬', '费用', '违约金', '逾期利息'],
      breach: ['违约', '赔偿', '损失', '罚则', '责任', '补救'],
      confidentiality: ['保密', '秘密', '披露', '泄露', '信息', '专有'],
      auto_renewal: ['自动续', '续约', '延期', '续期', '顺延'],
      termination: ['终止', '解除', '结束', '提前结束'],
      liability: ['责任', '承担', '连带', '限额', '豁免'],
      ip: ['知识产权', '专利', '商标', '著作权', '版权', '许可'],
      dispute: ['争议', '管辖', '诉讼', '仲裁', '法院'],
      force_majeure: ['不可抗力', '意外事件', '免责'],
      obligation: ['义务', '履行', '承诺', '保证'],
      definition: ['定义', '解释', '本合同所称', '系指'],
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
