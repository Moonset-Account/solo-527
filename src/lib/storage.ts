import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveFile(data: Buffer, originalName: string, mimeType: string): Promise<{
  fileName: string;
  filePath: string;
  fileSize: number;
}> {
  await ensureUploadDir();
  
  const ext = path.extname(originalName) || '';
  const fileName = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  await fs.writeFile(filePath, data);
  const stats = await fs.stat(filePath);
  
  return {
    fileName: originalName,
    filePath,
    fileSize: stats.size,
  };
}

export async function getFile(filePath: string): Promise<Buffer> {
  return fs.readFile(filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.warn('Failed to delete file:', err);
  }
}

export async function getFileStream(filePath: string) {
  const fs = require('fs');
  return fs.createReadStream(filePath);
}
