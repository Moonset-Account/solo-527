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

module.exports = router;
