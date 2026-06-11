import * as fs from 'fs';
import * as path from 'path';
import type { CodeDefaultFlag, FlagValue } from '../types';
import { detectType } from '../utils';

const CODE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.java', '.py', '.go', '.cs', '.rb', '.kt', '.swift'];
const DEFAULT_IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build', 'out', 'vendor', '.next', '.cache'];

interface ParsedComment {
  owner?: string;
  description?: string;
  deprecated?: boolean;
  deprecatedReason?: string;
  lastModified?: string;
}

export interface CodeScannerOptions {
  paths: string[];
  ignoreDirs?: string[];
  fileExtensions?: string[];
  flagPatterns?: RegExp[];
}

export class CodeScanner {
  private options: Required<CodeScannerOptions>;

  constructor(options: CodeScannerOptions) {
    this.options = {
      paths: options.paths,
      ignoreDirs: options.ignoreDirs || DEFAULT_IGNORE_DIRS,
      fileExtensions: options.fileExtensions || CODE_EXTENSIONS,
      flagPatterns: options.flagPatterns || this.getDefaultPatterns(),
    };
  }

  private getDefaultPatterns(): RegExp[] {
    return [
      /(?:const|let|var)\s+(?:FF|FEATURE|FLAG)[A-Z_]*\s*[:=]\s*['"]([^'"]+)['"]/g,
      /feature[Ff]lag\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g,
      /get[Ff]lag\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g,
      /getBoolean\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g,
      /getString\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g,
      /getInt\s*\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g,
      /flags?\[['"]([^'"]+)['"]\]\s*=\s*([^;\n]+)/g,
      /@FeatureFlag\s*\(\s*["']([^"']+)["']\s*,\s*defaultValue\s*=\s*([^)]+)/g,
      /\.isEnabled\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
  }

  async scan(): Promise<CodeDefaultFlag[]> {
    const flags: CodeDefaultFlag[] = [];
    const seenKeys = new Set<string>();

    for (const inputPath of this.options.paths) {
      const resolvedPath = path.resolve(inputPath);
      const files = await this.collectFiles(resolvedPath);

      for (const file of files) {
        const fileFlags = this.scanFile(file);
        for (const flag of fileFlags) {
          const dedupKey = `${flag.key}:${flag.file}:${flag.line}`;
          if (!seenKeys.has(dedupKey)) {
            seenKeys.add(dedupKey);
            flags.push(flag);
          }
        }
      }
    }

    return flags;
  }

  private async collectFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    if (!fs.existsSync(dir)) {
      return files;
    }

    const stat = fs.statSync(dir);
    if (stat.isFile()) {
      if (this.hasValidExtension(dir)) {
        return [dir];
      }
      return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (this.options.ignoreDirs.includes(entry.name)) continue;
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await this.collectFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile() && this.hasValidExtension(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private hasValidExtension(file: string): boolean {
    const ext = path.extname(file).toLowerCase();
    return this.options.fileExtensions.includes(ext);
  }

  private scanFile(filePath: string): CodeDefaultFlag[] {
    const flags: CodeDefaultFlag[] = [];
    let content: string;

    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch {
      return flags;
    }

    const lines = content.split('\n');
    const commentMap = this.buildCommentMap(lines);

    for (const pattern of this.options.flagPatterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        if (!key || !this.isValidKey(key)) continue;

        const lineNumber = this.getLineNumber(content, match.index);
        const defaultValue = match[2] ? this.parseValue(match[2].trim()) : undefined;
        const comment = commentMap.get(lineNumber) || commentMap.get(lineNumber - 1);

        const flag: CodeDefaultFlag = {
          key,
          value: defaultValue ?? null,
          type: detectType(defaultValue ?? null),
          source: 'code',
          file: filePath,
          line: lineNumber,
          owner: comment?.owner,
          description: comment?.description,
          deprecated: comment?.deprecated,
          deprecatedReason: comment?.deprecatedReason,
          lastModified: comment?.lastModified,
        };

        flags.push(flag);
      }
    }

    return flags;
  }

  private buildCommentMap(lines: string[]): Map<number, ParsedComment> {
    const map = new Map<number, ParsedComment>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const comment = this.parseComment(line);
      if (comment) {
        map.set(i + 2, comment);
        if (i + 1 < lines.length) {
          const nextComment = map.get(i + 1);
          if (nextComment) {
            map.set(i + 2, {
              ...nextComment,
              ...comment,
              description: [nextComment.description, comment.description].filter(Boolean).join(' ').trim() || undefined,
            });
          }
        }
      }

      const inlineComment = this.extractInlineComment(line);
      if (inlineComment) {
        const existing = map.get(i + 1) || {};
        map.set(i + 1, {
          ...existing,
          ...inlineComment,
          description: [existing.description, inlineComment.description].filter(Boolean).join(' ').trim() || undefined,
        });
      }
    }

    return map;
  }

  private parseComment(line: string): ParsedComment | null {
    const trimmed = line.trim();
    const commentMatch = trimmed.match(/^\/\/+\s*(.+)$/);
    if (!commentMatch) return null;

    return this.parseCommentText(commentMatch[1]);
  }

  private extractInlineComment(line: string): ParsedComment | null {
    const idx = line.indexOf('//');
    if (idx === -1) return null;
    return this.parseCommentText(line.slice(idx + 2));
  }

  private parseCommentText(text: string): ParsedComment | null {
    const result: ParsedComment = {};
    const content = text.trim();

    const ownerMatch = content.match(/(?:owner|负责人|@owner)[:\s]+@?([\w.-]+(?:@[\w.-]+)?)/i);
    if (ownerMatch) {
      result.owner = ownerMatch[1];
    }

    const lastModMatch = content.match(/(?:lastModified|updated|修改时间)[:\s]+(.+?)(?:\s+|$)/i);
    if (lastModMatch) {
      const d = new Date(lastModMatch[1]);
      if (!isNaN(d.getTime())) {
        result.lastModified = d.toISOString();
      }
    }

    if (/\b(deprecated|废弃)\b/i.test(content)) {
      result.deprecated = true;
      const depReason = content.match(/(?:deprecated|废弃)[:\s]+(.+)$/i);
      if (depReason) {
        result.deprecatedReason = depReason[1].trim();
      }
    }

    let desc = content
      .replace(/(?:owner|负责人|@owner)[:\s]+@?[\w.-]+(?:@[\w.-]+)?/i, '')
      .replace(/(?:lastModified|updated|修改时间)[:\s]+\S+/i, '')
      .replace(/(?:deprecated|废弃)[:\s]*.+?$/i, '')
      .replace(/^@[\w]+\s*/, '')
      .trim();

    if (desc) {
      result.description = desc;
    }

    if (!result.owner && !result.description && !result.deprecated && !result.lastModified) {
      return null;
    }

    return result;
  }

  private getLineNumber(content: string, index: number): number {
    return content.slice(0, index).split('\n').length;
  }

  private isValidKey(key: string): boolean {
    return key.length > 0 && key.length < 256 && /^[\w.-]+$/.test(key);
  }

  private parseValue(raw: string): FlagValue {
    const trimmed = raw.trim();

    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return null;

    if (/^['"`]/.test(trimmed)) {
      return trimmed.slice(1, -1);
    }

    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
      return num;
    }

    try {
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        return JSON.parse(trimmed.replace(/'/g, '"'));
      }
    } catch {}

    return trimmed;
  }
}
