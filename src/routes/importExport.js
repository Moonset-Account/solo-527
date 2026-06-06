const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const importExportController = require('../controllers/importExportController');
const { authenticateToken, checkPermission } = require('../middleware/auth');

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const fs = require('fs');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`),
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) cb(null, true);
    else cb(new Error('只支持 Excel 或 CSV 文件'));
  },
});

router.get('/', authenticateToken, importExportController.getTasks);
router.post('/export', authenticateToken, checkPermission('REPORT_EXPORT'), importExportController.createExportTask);
router.get('/export/:id/download', authenticateToken, checkPermission('REPORT_EXPORT'), importExportController.downloadExport);
router.post('/import', authenticateToken, checkPermission('DATA_IMPORT'), upload.single('file'), importExportController.createImportTask);

module.exports = router;
