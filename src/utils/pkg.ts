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

function tryFindPackageJson(): string | null {
  let current: string;
  // @ts-ignore - import.meta only available in ES modules, handled at runtime
  const metaUrl: string | undefined = typeof import.meta !== 'undefined' ? import.meta?.url : undefined;
  if (metaUrl) {
    current = dirname(fileURLToPath(metaUrl));
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      current = (globalThis as any).__dirname || __dirname;
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
