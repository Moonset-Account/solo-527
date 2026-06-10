import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { normalizePath, getExtension, getImageFormat, realPathSafe } from '../utils/path';
import { matchGlob } from '../utils/filter';
import { ImageDimensionParser } from './imageDimensions';
import type {
  ImageMeta,
  ImageFormat,
  SizeRule,
  GlobalSizeConfig,
  SizeViolation,
  DuplicateGroup,
} from '../types';
import type { ProgressBar } from '../utils/progress';

export interface ImageAnalysisResult {
  images: ImageMeta[];
  sizeViolations: SizeViolation[];
  duplicates: DuplicateGroup[];
  errors: string[];
}

const VALID_IMAGE_FORMATS: string[] = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'ico', 'bmp'];

function formatToEnum(ext: string): ImageFormat | null {
  const lower = ext.toLowerCase();
  return VALID_IMAGE_FORMATS.includes(lower) ? (lower as ImageFormat) : null;
}

function simplifyRatio(w: number, h: number): string {
  if (w === 0 || h === 0) return '0:0';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
}

function parseRatioString(ratio: string): [number, number] | null {
  const match = ratio.match(/^(\d+)\s*:\s*(\d+)$/);
  if (!match) return null;
  return [parseInt(match[1], 10), parseInt(match[2], 10)];
}

function ratioMatches(actualW: number, actualH: number, expected: string): boolean {
  const expectedParts = parseRatioString(expected);
  if (!expectedParts) return false;
  const [ew, eh] = expectedParts;
  if (actualW === 0 || actualH === 0 || ew === 0 || eh === 0) return false;
  const actualG = (a: number, b: number): number => (b === 0 ? a : actualG(b, a % b));
  const actualGcd = actualG(actualW, actualH);
  const expectedGcd = actualG(ew, eh);
  return actualW / actualGcd === ew / expectedGcd && actualH / actualGcd === eh / expectedGcd;
}

function resolveSizeRule(
  image: ImageMeta,
  config: GlobalSizeConfig,
): { rule: SizeRule | null; source: string } {
  for (const [globPattern, rule] of Object.entries(config.byPathGlob ?? {})) {
    if (matchGlob(image.normalizedPath, globPattern)) {
      return { rule, source: `path glob: ${globPattern}` };
    }
  }
  if (config.byFormat && config.byFormat[image.format]) {
    return { rule: config.byFormat[image.format]!, source: `format: ${image.format}` };
  }
  if (config.default) {
    return { rule: config.default, source: 'default' };
  }
  return { rule: null, source: 'none' };
}

function checkSizeViolation(image: ImageMeta, rule: SizeRule, source: string): SizeViolation | null {
  const issues: string[] = [];
  const { width, height } = image;

  if (rule.minWidth !== undefined && width < rule.minWidth) {
    issues.push(`宽度 ${width}px 小于最小值 ${rule.minWidth}px`);
  }
  if (rule.maxWidth !== undefined && width > rule.maxWidth) {
    issues.push(`宽度 ${width}px 大于最大值 ${rule.maxWidth}px`);
  }
  if (rule.minHeight !== undefined && height < rule.minHeight) {
    issues.push(`高度 ${height}px 小于最小值 ${rule.minHeight}px`);
  }
  if (rule.maxHeight !== undefined && height > rule.maxHeight) {
    issues.push(`高度 ${height}px 大于最大值 ${rule.maxHeight}px`);
  }
  if (rule.allowedRatios && rule.allowedRatios.length > 0) {
    const actualRatio = simplifyRatio(width, height);
    const matches = rule.allowedRatios.some((r) => ratioMatches(width, height, r));
    if (!matches) {
      issues.push(`比例 ${actualRatio} 不在允许列表 [${rule.allowedRatios.join(', ')}] 中`);
    }
  }

  if (issues.length === 0) return null;
  return { image, rule: { ...rule, _source: source } as SizeRule & { _source: string }, issues };
}

async function readFileHead(filePath: string, size: number): Promise<Uint8Array> {
  const fd = await fs.promises.open(filePath, 'r');
  try {
    const buffer = new Uint8Array(size);
    const result = await fd.read(buffer, 0, size, 0);
    return result.bytesRead < size ? buffer.slice(0, result.bytesRead) : buffer;
  } finally {
    await fd.close();
  }
}

async function computeMD5(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('md5');
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function buildImageMeta(imagePath: string): Promise<{ meta: ImageMeta | null; error?: string }> {
  const normalized = normalizePath(imagePath);
  try {
    const lstat = await fs.promises.lstat(imagePath);
    const stat = await fs.promises.stat(imagePath);

    const ext = getExtension(imagePath);
    const format = formatToEnum(ext);
    if (!format) return { meta: null, error: `不支持的格式: ${ext}` };

    let symlinkTarget: string | undefined;
    if (lstat.isSymbolicLink()) {
      try {
        symlinkTarget = await realPathSafe(imagePath);
      } catch {
        symlinkTarget = undefined;
      }
    }

    let width = 0;
    let height = 0;
    try {
      const headBuffer = await readFileHead(imagePath, 1024 * 1024);
      const dims = ImageDimensionParser.parse(headBuffer, format);
      width = dims.width;
      height = dims.height;
    } catch (e) {
      // ignore dimension errors, keep 0x0
    }

    const md5 = await computeMD5(imagePath);

    return {
      meta: {
        path: normalized,
        normalizedPath: normalized,
        format,
        width,
        height,
        fileSize: stat.size,
        md5,
        isSymlink: lstat.isSymbolicLink(),
        symlinkTarget,
      },
    };
  } catch (err) {
    return { meta: null, error: (err as Error).message };
  }
}

export async function analyzeImages(
  imagePaths: string[],
  sizeConfig: GlobalSizeConfig,
  progress?: ProgressBar,
): Promise<ImageAnalysisResult> {
  const errors: string[] = [];
  const images: ImageMeta[] = [];
  const sizeViolations: SizeViolation[] = [];
  const md5Groups = new Map<string, ImageMeta[]>();

  if (progress) progress.setStage('analyzing', imagePaths.length, '读取图片元数据');

  const concurrency = Math.min(8, imagePaths.length);
  let idx = 0;

  async function worker(): Promise<void> {
    while (idx < imagePaths.length) {
      const current = idx++;
      const p = imagePaths[current];
      const result = await buildImageMeta(p);
      if (result.meta) {
        const meta = result.meta;
        images.push(meta);
        if (!md5Groups.has(meta.md5)) {
          md5Groups.set(meta.md5, []);
        }
        md5Groups.get(meta.md5)!.push(meta);

        const { rule, source } = resolveSizeRule(meta, sizeConfig);
        if (rule) {
          const violation = checkSizeViolation(meta, rule, source);
          if (violation) sizeViolations.push(violation);
        }
      } else {
        errors.push(`无法解析图片: ${normalizePath(p)}: ${result.error ?? '未知错误'}`);
      }
      if (progress) progress.tick(normalizePath(p).split('/').pop() ?? p);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const duplicates: DuplicateGroup[] = [];
  for (const [md5, group] of md5Groups) {
    if (group.length > 1) {
      duplicates.push({
        md5,
        images: group.sort((a, b) => a.fileSize - b.fileSize),
      });
    }
  }

  images.sort((a, b) => a.normalizedPath.localeCompare(b.normalizedPath));
  duplicates.sort((a, b) => b.images.length - a.images.length);

  return { images, sizeViolations, duplicates, errors };
}
