import fs from 'node:fs';
import path from 'node:path';
import { normalizePath, relativePath } from '../utils/path';
import { matchGlob } from '../utils/filter';
import type {
  AuditConfig,
  AuditReport,
  ImageMeta,
  ReferenceInfo,
  UnreferencedCandidate,
  SymlinkWarning,
  SizeViolation,
  DuplicateGroup,
  MissingAlt,
} from '../types';
import type { ProgressBar } from '../utils/progress';
import { scanImageDirectory } from '../scanner/directoryScanner';
import { analyzeImages } from '../analyzer/imageAnalyzer';
import { analyzeReferences } from '../analyzer/referenceAnalyzer';
import { PathFilter } from '../utils/filter';

function computePathSimilarity(a: string, b: string): number {
  const aParts = normalizePath(a).split('/').filter(Boolean);
  const bParts = normalizePath(b).split('/').filter(Boolean);
  if (aParts.length === 0 || bParts.length === 0) return 0;

  let matches = 0;
  for (let i = 0; i < Math.min(aParts.length, bParts.length); i++) {
    if (aParts[aParts.length - 1 - i] === bParts[bParts.length - 1 - i]) {
      matches++;
    }
  }

  const aBase = aParts[aParts.length - 1] ?? '';
  const bBase = bParts[bParts.length - 1] ?? '';
  const baseSimilarity = longestCommonSubstring(aBase, bBase) / Math.max(1, Math.max(aBase.length, bBase.length));

  const structuralScore = matches / Math.min(aParts.length, bParts.length);
  return structuralScore * 0.4 + baseSimilarity * 0.6;
}

function longestCommonSubstring(a: string, b: string): number {
  if (!a || !b) return 0;
  const m = a.length;
  const n = b.length;
  let max = 0;
  const dp: number[][] = Array.from({ length: 2 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i % 2][j] = dp[(i - 1) % 2][j - 1] + 1;
        if (dp[i % 2][j] > max) max = dp[i % 2][j];
      } else {
        dp[i % 2][j] = 0;
      }
    }
  }
  return max;
}

function findPotentialMatches(
  unreferenced: ImageMeta,
  allReferences: ReferenceInfo[],
  allImages: ImageMeta[],
  limit: number = 5,
): Array<{ target: string; score: number }> {
  const results: Array<{ target: string; score: number }> = [];
  const unreferencedBase = path.basename(unreferenced.normalizedPath).toLowerCase();

  for (const ref of allReferences) {
    const refBase = path.basename(ref.rawRef).toLowerCase();
    const score = computePathSimilarity(unreferenced.normalizedPath.toLowerCase(), ref.rawRef.toLowerCase());
    if (score > 0.25) {
      results.push({ target: ref.rawRef, score });
    }
  }

  for (const img of allImages) {
    if (img.normalizedPath === unreferenced.normalizedPath) continue;
    const imgBase = path.basename(img.normalizedPath).toLowerCase();
    if (imgBase === unreferencedBase) continue;
    const score = computePathSimilarity(unreferenced.normalizedPath.toLowerCase(), img.normalizedPath.toLowerCase());
    if (score > 0.5) {
      results.push({ target: img.normalizedPath, score });
    }
  }

  const deduped = new Map<string, number>();
  for (const r of results) {
    const current = deduped.get(r.target) ?? 0;
    deduped.set(r.target, Math.max(current, r.score));
  }

  return [...deduped.entries()]
    .map(([target, score]) => ({ target, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface AuditEngineOptions {
  config: AuditConfig;
  progress?: ProgressBar;
  baseDir?: string;
}

export async function runAudit(options: AuditEngineOptions): Promise<AuditReport> {
  const { config, progress, baseDir = process.cwd() } = options;

  const allErrors: string[] = [];
  const symlinkWarnings: SymlinkWarning[] = [];

  if (progress) progress.start();

  if (progress) progress.setStage('scanning', undefined, '扫描图片目录...');
  const filter = PathFilter.create(config.include, config.ignore, baseDir);

  const scanResult = await scanImageDirectory(config.imageDir, filter);
  allErrors.push(...scanResult.errors);
  symlinkWarnings.push(...scanResult.symlinkWarnings);
  if (progress) progress.log(`找到 ${scanResult.imagePaths.length} 个候选图片文件`);
  if (scanResult.symlinkWarnings.length > 0) {
    for (const w of scanResult.symlinkWarnings) {
      if (progress) progress.log(`⚠️  软链接警告: ${w.message}`);
    }
  }

  if (progress) progress.setStage('hashing', scanResult.imagePaths.length, '计算哈希与尺寸');
  const imageAnalysis = await analyzeImages(scanResult.imagePaths, config.sizeRules, progress);
  allErrors.push(...imageAnalysis.errors);
  if (progress) progress.log(`成功分析 ${imageAnalysis.images.length} 个图片`);

  if (progress) progress.setStage('referencing', undefined, '解析引用关系...');
  const refAnalysis = await analyzeReferences(
    config.manifestPath,
    config.dynamicRefs,
    config.imageDir,
    imageAnalysis.images,
    progress,
  );
  allErrors.push(...refAnalysis.errors);
  if (progress) progress.log(`找到 ${refAnalysis.references.length} 条引用记录`);

  const referencedPaths = new Set(refAnalysis.references.map((r) => r.imagePath));
  const duplicatesMd5Keep = new Set<string>();
  for (const dup of imageAnalysis.duplicates) {
    if (dup.images.length > 0) duplicatesMd5Keep.add(dup.images[0].path);
  }

  const unreferencedCandidates: UnreferencedCandidate[] = [];
  if (progress) progress.setStage('reporting', imageAnalysis.images.length, '分析未引用素材...');

  const threshold = config.candidateThreshold ?? 0.0;
  let idx = 0;

  for (const img of imageAnalysis.images) {
    idx++;
    const isReferenced = referencedPaths.has(img.normalizedPath);
    const isDuplicateKeep = duplicatesMd5Keep.has(img.path);

    if (!isReferenced && !isDuplicateKeep) {
      const potential = findPotentialMatches(img, refAnalysis.references, imageAnalysis.images);
      const bestScore = potential.length > 0 ? potential[0].score : 0;
      if (bestScore >= threshold) {
        let mtime = 0;
        try {
          const stat = await fs.promises.stat(img.path);
          mtime = stat.mtimeMs;
        } catch {
          // ignore
        }
        unreferencedCandidates.push({
          image: img,
          lastModified: mtime,
          matchScore: bestScore,
          potentialMatches: potential.map((p) => p.target),
        });
      }
    }
    if (progress && idx % 20 === 0) progress.setCurrent(idx);
  }
  if (progress) progress.setCurrent(imageAnalysis.images.length);

  const report: AuditReport = {
    summary: {
      totalImages: imageAnalysis.images.length,
      totalReferences: refAnalysis.references.length,
      scannedAt: new Date().toISOString(),
    },
    sizeViolations: imageAnalysis.sizeViolations,
    duplicates: imageAnalysis.duplicates,
    missingAlts: refAnalysis.missingAlts,
    unreferencedCandidates: unreferencedCandidates.sort((a, b) => a.matchScore - b.matchScore),
    symlinkWarnings,
    errors: allErrors,
  };

  if (progress) {
    progress.finish(
      `完成: ${report.summary.totalImages} 张图片, ${report.summary.totalReferences} 条引用, ${report.unreferencedCandidates.length} 个候选待确认`,
    );
  }

  return report;
}
