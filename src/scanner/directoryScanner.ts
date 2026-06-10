import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, getImageFormat } from '../utils/path';
import type { PathFilter } from '../utils/filter';
import type { SymlinkWarning } from '../types';

export interface ScanResult {
  imagePaths: string[];
  symlinkWarnings: SymlinkWarning[];
  errors: string[];
}

interface ScanContext {
  visitedRealPaths: Set<string>;
  symlinkChain: string[];
  symlinkWarnings: SymlinkWarning[];
  errors: string[];
  imagePaths: string[];
}

async function detectSymlinkLoop(
  symlinkPath: string,
  context: ScanContext,
  maxDepth: number = 32,
): Promise<{ loop: boolean; cycle: string[]; target?: string }> {
  const chain: string[] = [normalizePath(symlinkPath)];
  let current = symlinkPath;
  let depth = 0;

  while (depth < maxDepth) {
    try {
      const stat = await fs.promises.lstat(current);
      if (!stat.isSymbolicLink()) {
        const real = normalizePath(current);
        return { loop: false, cycle: chain, target: real };
      }
      const linkTarget = await fs.promises.readlink(current);
      const resolvedTarget = path.isAbsolute(linkTarget)
        ? linkTarget
        : path.join(path.dirname(current), linkTarget);
      current = normalizePath(resolvedTarget);
      if (chain.includes(current)) {
        chain.push(current);
        return { loop: true, cycle: chain };
      }
      chain.push(current);
      depth++;
    } catch (err) {
      return {
        loop: false,
        cycle: chain,
        target: normalizePath(current),
      };
    }
  }

  return { loop: true, cycle: chain };
}

async function processEntry(
  entryPath: string,
  filter: PathFilter,
  context: ScanContext,
): Promise<void> {
  const normalized = normalizePath(entryPath);

  try {
    const lstat = await fs.promises.lstat(entryPath);

    if (lstat.isSymbolicLink()) {
      const detection = await detectSymlinkLoop(entryPath, context);

      if (detection.loop) {
        context.symlinkWarnings.push({
          path: normalized,
          message: `检测到软链接循环，已跳过: ${detection.cycle.join(' → ')}`,
          cycle: detection.cycle,
        });
        return;
      }

      const targetPath = detection.target;
      if (!targetPath) return;

      try {
        const targetStat = await fs.promises.stat(targetPath);

        if (targetStat.isDirectory()) {
          if (context.visitedRealPaths.has(targetPath)) {
            context.symlinkWarnings.push({
              path: normalized,
              message: `软链接目录已被访问过（可能循环），已跳过: ${targetPath}`,
              cycle: detection.cycle,
            });
            return;
          }
          context.visitedRealPaths.add(targetPath);
          await scanDirectory(targetPath, filter, context);
        } else if (targetStat.isFile()) {
          if (getImageFormat(targetPath) && filter.matches(normalized)) {
            context.imagePaths.push(normalized);
          }
        }
      } catch (err) {
        context.errors.push(`软链接目标无法访问: ${normalized} -> ${targetPath}: ${(err as Error).message}`);
      }
      return;
    }

    if (lstat.isDirectory()) {
      const realPath = normalizePath(await fs.promises.realpath(entryPath));
      if (context.visitedRealPaths.has(realPath)) return;
      context.visitedRealPaths.add(realPath);
      await scanDirectory(entryPath, filter, context);
      return;
    }

    if (lstat.isFile()) {
      if (getImageFormat(entryPath) && filter.matches(normalized)) {
        context.imagePaths.push(normalized);
      }
    }
  } catch (err) {
    context.errors.push(`处理文件失败: ${normalized}: ${(err as Error).message}`);
  }
}

async function scanDirectory(
  dirPath: string,
  filter: PathFilter,
  context: ScanContext,
): Promise<void> {
  let entries: fs.Dirent[];
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    context.errors.push(`无法读取目录: ${normalizePath(dirPath)}: ${(err as Error).message}`);
    return;
  }

  const tasks: Promise<void>[] = [];
  for (const entry of entries) {
    const entryFullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory() && !filter.matchesDirectory(entryFullPath)) {
      continue;
    }
    tasks.push(processEntry(entryFullPath, filter, context));
  }
  await Promise.all(tasks);
}

export async function scanImageDirectory(
  imageDir: string,
  filter: PathFilter,
): Promise<ScanResult> {
  const resolvedDir = normalizePath(imageDir);
  const context: ScanContext = {
    visitedRealPaths: new Set<string>(),
    symlinkChain: [],
    symlinkWarnings: [],
    errors: [],
    imagePaths: [],
  };

  let dirStat: fs.Stats;
  try {
    dirStat = await fs.promises.stat(resolvedDir);
  } catch (err) {
    return {
      imagePaths: [],
      symlinkWarnings: [],
      errors: [`图片目录不存在: ${resolvedDir}: ${(err as Error).message}`],
    };
  }

  if (!dirStat.isDirectory()) {
    return {
      imagePaths: [],
      symlinkWarnings: [],
      errors: [`指定路径不是目录: ${resolvedDir}`],
    };
  }

  const realRoot = normalizePath(await fs.promises.realpath(resolvedDir));
  context.visitedRealPaths.add(realRoot);
  await scanDirectory(resolvedDir, filter, context);

  context.imagePaths = [...new Set(context.imagePaths)].sort();

  return {
    imagePaths: context.imagePaths,
    symlinkWarnings: context.symlinkWarnings,
    errors: context.errors,
  };
}
