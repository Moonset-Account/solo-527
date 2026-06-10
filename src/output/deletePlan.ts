import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, ensureDirExists, relativePath } from '../utils/path';
import type { AuditReport, DeletePlan, DeleteAction, ImageMeta, DuplicateGroup } from '../types';
import type { ProgressBar } from '../utils/progress';

export interface GeneratePlanOptions {
  report: AuditReport;
  dryRun: boolean;
  outputDir?: string;
  planFileName?: string;
  undoFileName?: string;
  includeUnreferenced?: boolean;
  unreferencedScoreThreshold?: number;
  progress?: ProgressBar;
  baseDir?: string;
}

export interface GeneratePlanResult {
  plan: DeletePlan;
  planPath: string;
  undoPath: string;
}

export function buildDeleteActions(
  report: AuditReport,
  includeUnreferenced: boolean,
  unreferencedScoreThreshold: number = 0.5,
): DeleteAction[] {
  const actions: DeleteAction[] = [];
  const toDelete = new Set<string>();

  for (const group of report.duplicates) {
    if (group.images.length > 1) {
      for (let i = 1; i < group.images.length; i++) {
        const img = group.images[i];
        if (!toDelete.has(img.path)) {
          toDelete.add(img.path);
          actions.push({
            type: 'delete',
            image: img,
            reason: 'duplicate',
            originalPath: img.path,
          });
        }
      }
    }
  }

  if (includeUnreferenced) {
    for (const candidate of report.unreferencedCandidates) {
      if (candidate.matchScore <= unreferencedScoreThreshold && !toDelete.has(candidate.image.path)) {
        toDelete.add(candidate.image.path);
        actions.push({
          type: 'delete',
          image: candidate.image,
          reason: 'unreferenced',
          originalPath: candidate.image.path,
        });
      }
    }
  }

  return actions.sort((a, b) => a.originalPath.localeCompare(b.originalPath));
}

export function generateUndoCommands(actions: DeleteAction[], backupDir: string): string[] {
  const lines: string[] = [];
  lines.push('#!/usr/bin/env bash');
  lines.push('# 撤销清单 - 自动生成，用于恢复被移动的文件');
  lines.push(`# 生成时间: ${new Date().toISOString()}`);
  lines.push(`# 备份目录: ${backupDir}`);
  lines.push('');
  lines.push('set -e');
  lines.push('');
  lines.push('echo "开始撤销删除操作..."');
  lines.push('');

  for (let i = actions.length - 1; i >= 0; i--) {
    const action = actions[i];
    const basename = path.basename(action.originalPath);
    const uniqueName = `${i.toString().padStart(5, '0')}_${basename}`;
    const backupPath = normalizePath(path.join(backupDir, uniqueName));
    const targetDir = normalizePath(path.dirname(action.originalPath));

    lines.push(`# [${action.reason}] ${basename}`);
    lines.push(`mkdir -p "${targetDir}"`);
    lines.push(`if [ -f "${backupPath}" ]; then`);
    lines.push(`  mv -n "${backupPath}" "${action.originalPath}"`);
    lines.push(`  echo "恢复: ${basename}"`);
    lines.push(`else`);
    lines.push(`  echo "⚠ 备份文件不存在，跳过: ${backupPath}"`);
    lines.push(`fi`);
    lines.push('');
  }

  lines.push('echo "');
  lines.push('撤销完成！请检查文件是否正确恢复。');
  lines.push('');

  return lines;
}

export async function generateDeletePlan(
  options: GeneratePlanOptions,
): Promise<GeneratePlanResult> {
  const {
    report,
    dryRun,
    outputDir = process.cwd(),
    planFileName = `delete-plan-${Date.now()}.json`,
    undoFileName = `undo-${Date.now()}.sh`,
    includeUnreferenced = false,
    unreferencedScoreThreshold = 0.3,
    progress,
    baseDir = process.cwd(),
  } = options;

  if (progress) progress.setStage('reporting', undefined, '生成删除计划...');

  const normalizedOutDir = normalizePath(outputDir);
  ensureDirExists(normalizedOutDir);

  const timestamp = Date.now();
  const backupDirName = `.image-audit-backup-${timestamp}`;
  const backupDir = normalizePath(path.join(normalizedOutDir, backupDirName));

  const actions = buildDeleteActions(report, includeUnreferenced, unreferencedScoreThreshold);

  const undoCommands = generateUndoCommands(actions, backupDir);
  const undoPath = normalizePath(path.join(normalizedOutDir, undoFileName));

  const plan: DeletePlan = {
    generatedAt: new Date().toISOString(),
    dryRun,
    actions: actions.map((a, i) => {
      const basename = path.basename(a.originalPath);
      const uniqueName = `${i.toString().padStart(5, '0')}_${basename}`;
      return {
        ...a,
        backupPath: normalizePath(path.join(backupDir, uniqueName)),
      };
    }),
    undoList: [undoPath],
  };

  const planPath = normalizePath(path.join(normalizedOutDir, planFileName));
  await fs.promises.writeFile(planPath, JSON.stringify(plan, null, 2), 'utf-8');
  await fs.promises.writeFile(undoPath, undoCommands.join('\n'), 'utf-8');
  await fs.promises.chmod(undoPath, 0o755);

  if (progress) {
    progress.log(`📋 删除计划已保存: ${relativePath(baseDir, planPath)}`);
    progress.log(`↩️  撤销脚本已保存: ${relativePath(baseDir, undoPath)}`);
    progress.log(`📦 备份目录: ${relativePath(baseDir, backupDir)} (执行时自动创建)`);
  }

  return { plan, planPath, undoPath };
}

export async function executeDeletePlan(
  plan: DeletePlan,
  progress?: ProgressBar,
): Promise<{ success: number; failed: Array<{ path: string; error: string }> }> {
  const success: string[] = [];
  const failed: Array<{ path: string; error: string }> = [];

  if (plan.dryRun) {
    if (progress) progress.log('🔍 DRY-RUN 模式：不会实际删除或移动任何文件');
    return { success: plan.actions.length, failed: [] };
  }

  if (progress) {
    progress.setStage('reporting', plan.actions.length, '执行删除计划...');
  }

  let idx = 0;
  for (const action of plan.actions) {
    idx++;
    try {
      if (action.backupPath) {
        ensureDirExists(path.dirname(action.backupPath));
        await fs.promises.rename(action.originalPath, action.backupPath);
        success.push(action.originalPath);
      } else {
        await fs.promises.unlink(action.originalPath);
        success.push(action.originalPath);
      }
    } catch (err) {
      failed.push({ path: action.originalPath, error: (err as Error).message });
    }
    if (progress) progress.tick(path.basename(action.originalPath));
  }

  return { success: success.length, failed };
}
