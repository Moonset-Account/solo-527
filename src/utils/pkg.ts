import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

interface PackageJson {
  name: string;
  version: string;
  description: string;
  [key: string]: unknown;
}

let cachedPkg: PackageJson | null = null;

function getImportMetaUrl(): string | undefined {
  // @ts-expect-error - import.meta only available in ES modules, handled at runtime
  if (typeof import.meta !== 'undefined') {
    // @ts-expect-error - same reason
    return import.meta?.url as string | undefined;
  }
  return undefined;
}

interface NodeGlobals {
  __dirname?: string;
}

function tryFindPackageJson(): string | null {
  let current: string;
  const metaUrl = getImportMetaUrl();
  if (metaUrl) {
    current = dirname(fileURLToPath(metaUrl));
  } else {
    try {
      const g = globalThis as unknown as NodeGlobals & { __dirname?: string };
      current = g.__dirname ?? (typeof __dirname !== 'undefined' ? __dirname : process.cwd());
    } catch {
      current = process.cwd();
    }
  }

  for (let depth = 0; depth < 8; depth++) {
    const candidate = join(current, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  const cwdCandidate = join(process.cwd(), 'package.json');
  return existsSync(cwdCandidate) ? cwdCandidate : null;
}

export function getPackageJson(): PackageJson {
  if (cachedPkg) return cachedPkg;
  const path = tryFindPackageJson();
  if (path) {
    try {
      const raw = readFileSync(path, 'utf-8');
      cachedPkg = JSON.parse(raw) as PackageJson;
      return cachedPkg;
    } catch {
      // fall through
    }
  }
  cachedPkg = {
    name: 'i18n-diff-checker',
    version: '1.0.0',
    description: '多语言文案差异检查器',
  };
  return cachedPkg;
}

export const pkg = getPackageJson();
