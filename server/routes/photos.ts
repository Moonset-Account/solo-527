import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query } from '../db/index.ts';
import { authenticate, checkIssueAccess } from '../middleware/auth.ts';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

const router = express.Router();

router.post('/:issueId', authenticate, checkIssueAccess, upload.array('photos', 5), async (req, res) => {
  try {
    const { issueId } = req.params;
    const { photo_type = 'original' } = req.body;
    const user = req.user;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '没有上传文件' });
    }
    
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const photoRecords = [];
    
    for (const file of files) {
      const photoId = uuidv4();
      const result = await query(`
        INSERT INTO photos (id, issue_id, file_path, file_name, file_size, 
                           mime_type, photo_type, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        photoId, issueId, file.path, file.originalname, file.size,
        file.mimetype, photo_type, user.id
      ]);
      photoRecords.push(result.rows[0]);
    }
    
    await query(`
      INSERT INTO issue_logs (issue_id, action, created_by, comment)
      VALUES ($1, $2, $3, $4)
    `, [issueId, 'upload_photos', user.id, `上传了 ${files.length} 张${photo_type === 'rectification' ? '整改' : ''}照片`]);
    
    res.status(201).json({
      message: '照片上传成功',
      photos: photoRecords
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ error: error.message || '照片上传失败' });
  }
});

router.get('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    
    const result = await query(
      'SELECT * FROM photos WHERE id = $1',
      [photoId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '照片不存在' });
    }
    
    const photo = result.rows[0];
    
    if (fs.existsSync(photo.file_path)) {
      res.sendFile(photo.file_path);
    } else {
      res.status(404).json({ error: '照片文件不存在' });
    }
  } catch (error) {
    console.error('Get photo error:', error);
    res.status(500).json({ error: '获取照片失败' });
  }
});

export default router;
