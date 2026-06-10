import micromatch from 'micromatch';
import { normalizePath, toPosixPath } from './path';

export interface FilterOptions {
  include?: string[];
  ignore?: string[];
  baseDir?: string;
}

const DEFAULT_INCLUDE = ['**/*.{png,jpg,jpeg,gif,webp,svg,avif,ico,bmp}'];

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.cache/**',
  '**/*.bak',
  '**/~*',
];

export class PathFilter {
  private includePatterns: string[];
  private ignorePatterns: string[];
  private baseDir?: string;

  constructor(options: FilterOptions = {}) {
    this.baseDir = options.baseDir;
    this.includePatterns = this.normalizePatterns(options.include ?? DEFAULT_INCLUDE);
    this.ignorePatterns = this.normalizePatterns([...DEFAULT_IGNORE, ...(options.ignore ?? [])]);
  }

  private normalizePatterns(patterns: string[]): string[] {
    return patterns.map((p) => toPosixPath(p.trim())).filter((p) => p.length > 0);
  }

  private resolveForMatch(filePath: string): string {
    let resolved = normalizePath(filePath, this.baseDir);
    if (this.baseDir) {
      const base = normalizePath(this.baseDir);
      if (resolved.startsWith(base)) {
        resolved = resolved.slice(base.length);
        if (resolved.startsWith('/')) resolved = resolved.slice(1);
      }
    }
    return resolved;
  }

  matchesDirectory(dirPath: string): boolean {
    const forMatch = this.resolveForMatch(dirPath);
    if (this.ignorePatterns.length > 0 && micromatch.isMatch(forMatch, this.ignorePatterns, { dot: true })) {
      return false;
    }
    if (this.ignorePatterns.length > 0 && micromatch.isMatch(forMatch + '/', this.ignorePatterns, { dot: true })) {
      return false;
    }
    return true;
  }

  matches(filePath: string): boolean {
    const forMatch = this.resolveForMatch(filePath);
    if (this.ignorePatterns.length > 0 && micromatch.isMatch(forMatch, this.ignorePatterns, { dot: true })) {
      return false;
    }
    if (this.includePatterns.length > 0) {
      return micromatch.isMatch(forMatch, this.includePatterns, { dot: true, nocase: true });
    }
    return true;
  }

  matchesAny(filePaths: string[]): boolean {
    return filePaths.some((p) => this.matches(p));
  }

  static create(include?: string[], ignore?: string[], baseDir?: string): PathFilter {
    return new PathFilter({ include, ignore, baseDir });
  }
}

export function matchGlob(filePath: string, patterns: string | string[]): boolean {
  const arr = Array.isArray(patterns) ? patterns : [patterns];
  return micromatch.isMatch(toPosixPath(filePath), arr, { dot: true, nocase: true });
}

export function expandGlobsToRegex(patterns: string[]): RegExp[] {
  return patterns.map((p) => micromatch.makeRe(p, { dot: true, nocase: true }));
}
