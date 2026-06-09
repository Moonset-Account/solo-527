const express = require('express');
const router = express.Router();
const multer = require('multer');
const config = require('../config');
const { authenticate, canManageContract, canApproveRisk } = require('../middleware/auth');
const ContractService = require('../services/contractService');
const VectorStoreService = require('../services/vectorStoreService');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: config.server.maxFileSize },
  fileFilter: (req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (config.server.allowedFileTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的文件类型: ${ext}`));
    }
  },
});

router.get('/', authenticate, async (req, res) => {
  try {
    const options = {
      status: req.query.status,
      contract_type: req.query.contract_type,
      uploader_id: req.userRole === 'admin' ? req.query.uploader_id : req.userId,
      reviewer_id: req.userRole === 'reviewer' ? req.userId : req.query.reviewer_id,
      search: req.query.search,
      limit: parseInt(req.query.limit, 10) || 20,
      offset: parseInt(req.query.offset, 10) || 0,
    };

    const result = await ContractService.listContracts(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', authenticate, canManageContract, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传合同文件' });
    }

    const result = await ContractService.uploadContract(
      {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      req.body,
      req.userId,
      req.userIp
    );

    res.status(201).json(result);
  } catch (error) {
    if (error.message.includes('不支持的文件类型') || error.message.includes('文件过大')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/new-version', authenticate, canManageContract, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传合同文件' });
    }

    const result = await ContractService.createNewVersion(
      req.params.id,
      {
        originalname: req.file.originalname,
        buffer: req.file.buffer,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      req.body,
      req.userId,
      req.userIp
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await ContractService.getContractWithDetails(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: '合同不存在' });
    }
    res.json(contract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/versions', authenticate, async (req, res) => {
  try {
    const versions = await ContractService.getContractVersions(req.params.id);
    res.json({ versions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/rollback', authenticate, canManageContract, async (req, res) => {
  try {
    const { target_version } = req.body;
    if (!target_version) {
      return res.status(400).json({ error: '请指定回滚版本号' });
    }

    const result = await ContractService.rollbackToVersion(
      req.params.id,
      target_version,
      req.userId,
      req.userIp
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/approve', authenticate, canApproveRisk, async (req, res) => {
  try {
    const contract = await ContractService.approveContract(
      req.params.id,
      req.userId,
      req.userIp
    );
    res.json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reject', authenticate, canApproveRisk, async (req, res) => {
  try {
    const { reason } = req.body;
    const contract = await ContractService.rejectContract(
      req.params.id,
      req.userId,
      req.userIp,
      reason
    );
    res.json(contract);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/vector-indexes', authenticate, async (req, res) => {
  try {
    const history = await VectorStoreService.getIndexHistory(req.params.id);
    res.json({ indexes: history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/rollback-index', authenticate, canManageContract, async (req, res) => {
  try {
    const { target_version } = req.body;
    const result = await VectorStoreService.rollbackIndex(
      req.params.id,
      target_version,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/semantic-search', authenticate, async (req, res) => {
  try {
    const { contract_id, query, top_k, clause_types } = req.body;

    if (!contract_id || !query) {
      return res.status(400).json({ error: '缺少 contract_id 或 query 参数' });
    }

    const results = await VectorStoreService.semanticSearch(
      contract_id,
      query,
      {
        topK: top_k || 5,
        clauseTypes: clause_types,
      }
    );

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cross-search', authenticate, async (req, res) => {
  try {
    const { query, top_k, contract_ids, clause_types } = req.body;
    if (!query) {
      return res.status(400).json({ error: '缺少 query 参数' });
    }

    const results = await VectorStoreService.searchAcrossContracts(query, {
      topK: top_k || 10,
      contractIds: contract_ids,
      clauseTypes: clause_types,
    });

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase();
    const allowed = ['.json', '.csv', '.xlsx', '.xls'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`不支持的导入文件类型: ${ext}，仅支持 ${allowed.join(', ')}`));
    }
  },
});

router.post(
  '/:id/import-clauses',
  authenticate,
  canManageContract,
  importUpload.single('file'),
  async (req, res) => {
    try {
      const contractId = req.params.id;
      const { contract_version_id } = req.body;

      let importData;
      let format;

      if (req.file) {
        const ext = require('path').extname(req.file.originalname).toLowerCase().replace('.', '');
        format = ext === 'xlsx' ? 'xlsx' : (ext === 'csv' ? 'csv' : 'json');
        importData = req.file.buffer;
      } else if (req.body && typeof req.body.clauses === 'string') {
        importData = req.body.clauses;
        format = req.body.format || 'json';
      } else if (req.body && Array.isArray(req.body.clauses)) {
        importData = Buffer.from(JSON.stringify(req.body.clauses), 'utf-8');
        format = 'json';
      } else {
        importData = Buffer.from(JSON.stringify(req.body), 'utf-8');
        format = 'json';
      }

      if (!contract_version_id) {
        const ContractService = require('../services/contractService');
        const versions = await ContractService.getContractVersions(contractId);
        const active = versions.find(v => v.is_active);
        if (!active) {
          return res.status(400).json({ error: '找不到活跃版本，请指定 contract_version_id' });
        }
      }

      const ContractService = require('../services/contractService');
      const versions = await ContractService.getContractVersions(contractId);
      const active = versions.find(v => v.is_active);
      const versionId = contract_version_id || (active && active.id);

      if (!versionId) {
        return res.status(400).json({ error: '找不到有效的合同版本' });
      }

      const result = await ContractService.importClauses(
        contractId, versionId, importData, format,
        req.userId, req.userIp
      );

      res.json({
        success: true,
        message: `成功导入 ${result.imported} 条条款`,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('合同已通过') || error.message.includes('不支持')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

router.post(
  '/:id/import-reviews',
  authenticate,
  canApproveRisk,
  importUpload.single('file'),
  async (req, res) => {
    try {
      const contractId = req.params.id;

      let importData;
      let format;

      if (req.file) {
        const ext = require('path').extname(req.file.originalname).toLowerCase().replace('.', '');
        format = ext === 'xlsx' ? 'xlsx' : (ext === 'csv' ? 'csv' : 'json');
        importData = req.file.buffer;
      } else if (req.body && typeof req.body.reviews === 'string') {
        importData = req.body.reviews;
        format = req.body.format || 'json';
      } else if (req.body && Array.isArray(req.body.reviews)) {
        importData = Buffer.from(JSON.stringify(req.body.reviews), 'utf-8');
        format = 'json';
      } else {
        importData = Buffer.from(JSON.stringify(req.body), 'utf-8');
        format = 'json';
      }

      const ContractService = require('../services/contractService');
      const result = await ContractService.importReviewResults(
        contractId, importData, format,
        req.userId, req.userIp
      );

      res.json({
        success: true,
        message: `复核结果导入完成：成功应用 ${result.applied} / ${result.total_parsed} 条`,
        ...result,
      });
    } catch (error) {
      if (error.message.includes('合同已通过')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
