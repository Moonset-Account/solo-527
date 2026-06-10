import path from 'node:path';
import fs from 'node:fs';

export function normalizePath(inputPath: string, baseDir?: string): string {
  let resolved = inputPath;
  if (baseDir && !path.isAbsolute(resolved)) {
    resolved = path.join(baseDir, resolved);
  }
  if (!path.isAbsolute(resolved)) {
    resolved = path.resolve(resolved);
  }
  resolved = path.normalize(resolved);
  return resolved.replace(/\\/g, '/');
}

export function toPosixPath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/');
}

export function relativePath(from: string, to: string): string {
  const rel = path.relative(from, to);
  return toPosixPath(rel);
}

export async function realPathSafe(inputPath: string): Promise<string> {
  try {
    const real = await fs.promises.realpath(inputPath);
    return normalizePath(real);
  } catch {
    return normalizePath(inputPath);
  }
}

export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase().slice(1);
}

export function getImageFormat(filePath: string): string | null {
  const ext = getExtension(filePath);
  const validFormats = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'ico', 'bmp'];
  return validFormats.includes(ext) ? ext : null;
}

export function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function isSubPath(parent: string, child: string): boolean {
  const parentNorm = normalizePath(parent);
  const childNorm = normalizePath(child);
  return childNorm.startsWith(parentNorm.endsWith('/') ? parentNorm : parentNorm + '/');
}
