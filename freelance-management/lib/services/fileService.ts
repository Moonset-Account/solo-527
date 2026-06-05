import { db } from '@/lib/db/schema';
import { ProjectFile, Role } from '@/types';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {
    // Directory already exists
  }
}

export function getProjectFiles(projectId: number, userId: number, role: Role): ProjectFile[] {
  if (role === Role.CLIENT) {
    return db.prepare(`
      SELECT * FROM project_files 
      WHERE project_id = ? AND is_public = 1
      ORDER BY created_at DESC
    `).all(projectId) as ProjectFile[];
  }
  return db.prepare(`
    SELECT * FROM project_files 
    WHERE project_id = ?
    ORDER BY created_at DESC
  `).all(projectId) as ProjectFile[];
}

export async function uploadProjectFile(
  projectId: number,
  file: File,
  uploadedBy: number,
  isPublic: boolean = false
): Promise<ProjectFile> {
  await ensureUploadDir();
  
  const ext = path.extname(file.name);
  const filename = `${Date.now()}_${Math.random().toString(36).substring(2)}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  const relativePath = `/uploads/${filename}`;
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await writeFile(filePath, buffer);
  
  const stmt = db.prepare(`
    INSERT INTO project_files (project_id, name, file_path, file_size, uploaded_by, is_public)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    projectId,
    file.name,
    relativePath,
    file.size,
    uploadedBy,
    isPublic ? 1 : 0
  );
  
  return db.prepare('SELECT * FROM project_files WHERE id = ?').get(result.lastInsertRowid) as ProjectFile;
}

export function deleteProjectFile(fileId: number, userId: number, role: Role): boolean {
  const file = db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId) as ProjectFile;
  if (!file) return false;
  
  if (role === Role.CLIENT && file.uploaded_by !== userId) {
    return false;
  }
  
  const fullPath = path.join(process.cwd(), 'public', file.file_path);
  try {
    unlink(fullPath).catch(() => {});
  } catch (e) {
    // File might not exist
  }
  
  db.prepare('DELETE FROM project_files WHERE id = ?').run(fileId);
  return true;
}
