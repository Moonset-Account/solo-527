import express from 'express';
import { upload, getUploadPath } from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/single', auth, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    res.json({
      url: getUploadPath(req.file.filename),
      name: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      filename: req.file.filename
    });
  } catch (error) {
    next(error);
  }
});

router.post('/multiple', auth, upload.array('files', 10), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }

    const files = req.files.map(file => ({
      url: getUploadPath(file.filename),
      name: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      filename: file.filename
    }));

    res.json({ files });
  } catch (error) {
    next(error);
  }
});

export default router;
