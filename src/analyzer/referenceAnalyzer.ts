import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { normalizePath, toPosixPath, getImageFormat, relativePath } from '../utils/path';
import type { DynamicRefRule, ReferenceInfo, MissingAlt, ImageMeta } from '../types';
import type { ProgressBar } from '../utils/progress';

export interface ReferenceAnalysisResult {
  references: ReferenceInfo[];
  missingAlts: MissingAlt[];
  errors: string[];
}

interface ManifestEntry {
  imagePath: string;
  alt?: string;
  source?: string;
}

async function parseManifest(
  manifestPath: string,
  imageDir: string,
): Promise<{ entries: ManifestEntry[]; errors: string[] }> {
  const entries: ManifestEntry[] = [];
  const errors: string[] = [];

  try {
    const content = await fs.promises.readFile(manifestPath, 'utf-8');
    const ext = path.extname(manifestPath).toLowerCase();

    if (ext === '.json') {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (typeof item === 'string') {
            entries.push({ imagePath: resolveManifestImagePath(item, imageDir, manifestPath) });
          } else if (item && typeof item === 'object' && typeof item.imagePath === 'string') {
            entries.push({
              imagePath: resolveManifestImagePath(item.imagePath, imageDir, manifestPath),
              alt: typeof item.alt === 'string' ? item.alt : undefined,
              source: typeof item.source === 'string' ? item.source : manifestPath,
            });
          }
        }
      } else if (parsed && typeof parsed === 'object') {
        for (const [key, value] of Object.entries(parsed)) {
          if (typeof value === 'string') {
            entries.push({
              imagePath: resolveManifestImagePath(value, imageDir, manifestPath),
              source: manifestPath,
            });
          } else if (value && typeof value === 'object' && (value as any).src) {
            entries.push({
              imagePath: resolveManifestImagePath((value as any).src, imageDir, manifestPath),
              alt: typeof (value as any).alt === 'string' ? (value as any).alt : undefined,
              source: manifestPath,
            });
          }
        }
      }
    } else {
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const parts = line.split(/\s+/);
        entries.push({
          imagePath: resolveManifestImagePath(parts[0], imageDir, manifestPath),
          source: `${manifestPath}:${i + 1}`,
        });
      }
    }
  } catch (err) {
    errors.push(`解析引用清单失败 ${manifestPath}: ${(err as Error).message}`);
  }

  return { entries, errors };
}

function resolveManifestImagePath(
  relativeOrAbsolute: string,
  imageDir: string,
  manifestPath: string,
): string {
  if (path.isAbsolute(relativeOrAbsolute)) {
    return normalizePath(relativeOrAbsolute);
  }
  const fromImageDir = normalizePath(path.join(imageDir, relativeOrAbsolute));
  if (fs.existsSync(fromImageDir)) {
    return fromImageDir;
  }
  const fromManifestDir = normalizePath(path.join(path.dirname(manifestPath), relativeOrAbsolute));
  if (fs.existsSync(fromManifestDir)) {
    return fromManifestDir;
  }
  return normalizePath(relativeOrAbsolute);
}

function findAllMatchingImages(
  potentialPath: string,
  allImagePaths: Set<string>,
  imageDir: string,
): string[] {
  const candidates: string[] = [];
  const variants = buildPathVariants(potentialPath, imageDir);

  for (const variant of variants) {
    if (allImagePaths.has(variant)) {
      candidates.push(variant);
    }
  }
  return candidates;
}

function buildPathVariants(rawPath: string, imageDir: string): string[] {
  const cleaned = rawPath.replace(/^["']|["']$/g, '').replace(/\?.*$/, '').replace(/#.*$/, '');
  if (!cleaned) return [];

  const variants: Set<string> = new Set();

  if (path.isAbsolute(cleaned)) {
    variants.add(normalizePath(cleaned));
  } else {
    variants.add(normalizePath(path.join(imageDir, cleaned)));
    const ext = getImageFormat(cleaned);
    if (!ext) {
      for (const e of ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif']) {
        variants.add(normalizePath(path.join(imageDir, `${cleaned}.${e}`)));
      }
    }
  }

  return [...variants];
}

interface ParsedSourceFile {
  references: ReferenceInfo[];
  missingAltRefs: Array<{ reference: ReferenceInfo; imagePath: string }>;
}

function parseSourceFile(
  filePath: string,
  content: string,
  imageDir: string,
  allImagePaths: Set<string>,
  processedDirs: string[],
): ParsedSourceFile {
  const references: ReferenceInfo[] = [];
  const missingAltRefs: Array<{ reference: ReferenceInfo; imagePath: string }> = [];
  const normalizedSource = normalizePath(filePath);

  const addRef = (rawRef: string, lineNumber: number, alt?: string, autoResolved?: string) => {
    const resolved = autoResolved ?? resolveImageReference(rawRef, imageDir, allImagePaths, processedDirs, filePath);
    if (resolved) {
      const ref: ReferenceInfo = {
        imagePath: resolved,
        sourceFile: normalizedSource,
        line: lineNumber,
        alt: alt && alt.trim() !== '' ? alt : undefined,
        rawRef,
      };
      references.push(ref);
      if (!alt || alt.trim() === '') {
        missingAltRefs.push({ reference: ref, imagePath: resolved });
      }
    }
  };

  const lines = content.split(/\r?\n/);
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const lineNo = li + 1;

    const imgRegex = /<img[^>]*?src\s*=\s*(['"])([^'"]+)\1[^>]*?(?:alt\s*=\s*(['"])([^'"]*)\3)?[^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(line)) !== null) {
      const src = match[2];
      const alt = match[4];
      addRef(src, lineNo, alt);
    }

    const importExportRegex =
      /(?:import|export)\s+(?:[^'"]*?from\s+)?(['"])((?:(?!\1)[\s\S])*?\.(?:png|jpe?g|gif|webp|svg|avif|ico|bmp)(?:\?[^'"]*)?)\1/gi;
    while ((match = importExportRegex.exec(line)) !== null) {
      addRef(match[2], lineNo, undefined);
    }

    const requireRegex =
      /require\s*\(\s*(['"])([^'"]*?\.(?:png|jpe?g|gif|webp|svg|avif|ico|bmp)(?:\?[^'"]*)?)\1\s*\)/gi;
    while ((match = requireRegex.exec(line)) !== null) {
      addRef(match[2], lineNo, undefined);
    }

    const urlRegex = /url\s*\(\s*(['"]?)([^)'"]*?\.(?:png|jpe?g|gif|webp|svg|avif|ico|bmp)(?:\?[^)'"]*)?)\1\s*\)/gi;
    while ((match = urlRegex.exec(line)) !== null) {
      addRef(match[2], lineNo, undefined);
    }

    const srcSetRegex = /srcSet\s*=\s*(['"])([^'"]+)\1/gi;
    while ((match = srcSetRegex.exec(line)) !== null) {
      const srcSetParts = match[2].split(',').map((s) => s.trim().split(/\s+/)[0]);
      for (const p of srcSetParts) {
        if (p) addRef(p, lineNo, undefined);
      }
    }
  }

  return { references, missingAltRefs };
}

function resolveImageReference(
  rawRef: string,
  imageDir: string,
  allImagePaths: Set<string>,
  processedDirs: string[],
  sourceFilePath: string,
): string | undefined {
  const cleaned = rawRef.replace(/\?.*$/, '').replace(/#.*$/, '');
  if (!cleaned) return undefined;

  const tryDirect = (base: string): string | undefined => {
    const candidate = normalizePath(path.join(base, cleaned));
    return allImagePaths.has(candidate) ? candidate : undefined;
  };

  if (path.isAbsolute(cleaned)) {
    const abs = normalizePath(cleaned);
    return allImagePaths.has(abs) ? abs : undefined;
  }

  const sourceDir = path.dirname(sourceFilePath);
  const fromSource = tryDirect(sourceDir);
  if (fromSource) return fromSource;

  const fromImageDir = tryDirect(imageDir);
  if (fromImageDir) return fromImageDir;

  for (const dir of processedDirs) {
    const fromDir = tryDirect(dir);
    if (fromDir) return fromDir;
  }

  const basename = path.basename(cleaned);
  for (const imgPath of allImagePaths) {
    if (imgPath.endsWith('/' + basename) || imgPath.endsWith('\\' + basename)) {
      return imgPath;
    }
  }

  return undefined;
}

export async function analyzeReferences(
  manifestPath: string | undefined,
  dynamicRules: DynamicRefRule[],
  imageDir: string,
  allImages: ImageMeta[],
  progress?: ProgressBar,
): Promise<ReferenceAnalysisResult> {
  const errors: string[] = [];
  const references: ReferenceInfo[] = [];
  const missingAltsMap = new Map<string, MissingAlt>();

  const allImagePaths = new Set(allImages.map((i) => i.normalizedPath));
  const imageByPath = new Map(allImages.map((i) => [i.normalizedPath, i]));

  if (manifestPath) {
    if (progress) progress.log(`解析引用清单: ${manifestPath}`);
    const { entries, errors: manifestErrors } = await parseManifest(manifestPath, imageDir);
    errors.push(...manifestErrors);

    for (const entry of entries) {
      const matches = findAllMatchingImages(entry.imagePath, allImagePaths, imageDir);
      for (const m of matches) {
        const ref: ReferenceInfo = {
          imagePath: m,
          sourceFile: entry.source ?? manifestPath,
          alt: entry.alt,
          rawRef: entry.imagePath,
        };
        references.push(ref);
        if ((!entry.alt || entry.alt.trim() === '') && imageByPath.has(m)) {
          const key = `${ref.sourceFile}:${ref.imagePath}`;
          if (!missingAltsMap.has(key)) {
            missingAltsMap.set(key, { reference: ref, image: imageByPath.get(m)! });
          }
        }
      }
    }
  }

  const allRules = defaultDynamicRules().concat(dynamicRules || []);
  const processedDirs: string[] = [];

  for (const rule of allRules) {
    if (progress) progress.log(`扫描动态引用规则: ${rule.glob}`);
    let matchedFiles: string[] = [];
    try {
      matchedFiles = await glob(rule.glob, {
        cwd: process.cwd(),
        absolute: true,
        nodir: true,
        ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      });
    } catch (err) {
      errors.push(`Glob 展开失败 ${rule.glob}: ${(err as Error).message}`);
      continue;
    }

    if (matchedFiles.length === 0) continue;

    if (progress) progress.setStage('referencing', matchedFiles.length, rule.glob.split('/').pop() ?? rule.glob);

    for (let i = 0; i < matchedFiles.length; i++) {
      const srcFile = matchedFiles[i];
      try {
        const content = await fs.promises.readFile(srcFile, 'utf-8');
        const dirsForFile = Array.from(new Set([process.cwd(), ...processedDirs]));
        const parsed = parseSourceFile(srcFile, content, imageDir, allImagePaths, dirsForFile);

        references.push(...parsed.references);
        for (const mar of parsed.missingAltRefs) {
          if (imageByPath.has(mar.imagePath)) {
            const key = `${mar.reference.sourceFile}:${mar.reference.line ?? 0}:${mar.imagePath}`;
            if (!missingAltsMap.has(key)) {
              missingAltsMap.set(key, { reference: mar.reference, image: imageByPath.get(mar.imagePath)! });
            }
          }
        }
        const dir = toPosixPath(path.dirname(srcFile));
        if (!processedDirs.includes(dir)) processedDirs.push(dir);
      } catch (err) {
        errors.push(`读取源文件失败 ${srcFile}: ${(err as Error).message}`);
      }
      if (progress && (i + 1) % 5 === 0) progress.setCurrent(i + 1, relativePath(process.cwd(), srcFile).split('/').pop() ?? srcFile);
    }
    if (progress) progress.setCurrent(matchedFiles.length);
  }

  const dedupedRefs: ReferenceInfo[] = [];
  const seenRef = new Set<string>();
  for (const ref of references) {
    const key = `${ref.sourceFile}:${ref.line ?? 0}:${ref.imagePath}:${ref.rawRef}`;
    if (!seenRef.has(key)) {
      seenRef.add(key);
      dedupedRefs.push(ref);
    }
  }

  return {
    references: dedupedRefs,
    missingAlts: Array.from(missingAltsMap.values()),
    errors,
  };
}

function defaultDynamicRules(): DynamicRefRule[] {
  return [
    { pattern: 'react_tsx', glob: '**/*.{tsx,jsx,ts,js,mjs,cjs}' },
    { pattern: 'html_vue', glob: '**/*.{html,vue,svelte,astro}' },
    { pattern: 'styles', glob: '**/*.{css,scss,less,styl}' },
    { pattern: 'markdown', glob: '**/*.{md,mdx}' },
  ];
}
