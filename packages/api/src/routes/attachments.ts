import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
import { Attachment, ApiResponse } from '@app/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.UPLOAD_DIR || 
  path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${nanoid(16)}${ext}`;
    cb(null, filename);
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  }
});

export const attachmentRouter = Router();

attachmentRouter.post('/upload', upload.array('files', 10), (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      const response: ApiResponse = {
        success: false,
        error: '未找到上传文件'
      };
      return res.status(400).json(response);
    }

    const files = req.files as Express.Multer.File[];
    const userId = (req as any).user?.id || 'system';

    const attachments: Attachment[] = files.map(file => ({
      id: nanoid(16),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`,
      uploadedBy: userId,
      uploadedAt: new Date()
    }));

    const response: ApiResponse<Attachment[]> = {
      success: true,
      data: attachments,
      message: `成功上传 ${attachments.length} 个文件`
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : '上传失败'
    };
    res.status(500).json(response);
  }
});

attachmentRouter.use('/static', express.static(uploadDir));
