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

interface ConstMapping {
  name: string;
  key: string;
  line: number;
  comment?: ParsedComment;
}

interface FunctionCall {
  funcName: string;
  keyArg: string;
  valueArg?: string;
  line: number;
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
      /flags?\[['"]([^'"]+)['"]\]\s*=\s*([^;\n]+)/g,
      /@FeatureFlag\s*\(\s*["']([^"']+)["']\s*,\s*defaultValue\s*=\s*([^)]+)/g,
      /\.isEnabled\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    ];
  }

  async scan(): Promise<CodeDefaultFlag[]> {
    const flags: CodeDefaultFlag[] = [];

    for (const inputPath of this.options.paths) {
      const resolvedPath = path.resolve(inputPath);
      const files = await this.collectFiles(resolvedPath);

      for (const file of files) {
        const fileFlags = this.scanFile(file);
        flags.push(...fileFlags);
      }
    }

    const merged = this.mergeFlagsByKey(flags);
    return merged;
  }

  private mergeFlagsByKey(flags: CodeDefaultFlag[]): CodeDefaultFlag[] {
    const map = new Map<string, CodeDefaultFlag>();

    for (const flag of flags) {
      const existing = map.get(flag.key);
      if (!existing) {
        map.set(flag.key, { ...flag });
        continue;
      }

      if (existing.value === null && flag.value !== null) {
        existing.value = flag.value;
        existing.type = flag.type;
      }
      if (!existing.owner && flag.owner) {
        existing.owner = flag.owner;
      }
      if (!existing.description && flag.description) {
        existing.description = flag.description;
      }
      if (!existing.deprecated && flag.deprecated) {
        existing.deprecated = flag.deprecated;
        existing.deprecatedReason = flag.deprecatedReason;
      }
      if (!existing.lastModified && flag.lastModified) {
        existing.lastModified = flag.lastModified;
      }
      if (flag.line < existing.line) {
        existing.line = flag.line;
        existing.file = flag.file;
      }
    }

    return Array.from(map.values());
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

    const constMappings = this.extractConstMappings(content, commentMap);

    const constMap = new Map<string, ConstMapping>();
    for (const cm of constMappings) {
      constMap.set(cm.name, cm);
    }

    for (const cm of constMappings) {
      if (this.isValidKey(cm.key)) {
        const comment = cm.comment;
        flags.push({
          key: cm.key,
          value: null,
          type: 'null',
          source: 'code',
          file: filePath,
          line: cm.line,
          owner: comment?.owner,
          description: comment?.description,
          deprecated: comment?.deprecated,
          deprecatedReason: comment?.deprecatedReason,
          lastModified: comment?.lastModified,
        });
      }
    }

    const functionCalls = this.extractFunctionCalls(content);

    for (const call of functionCalls) {
      let flagKey: string | undefined;
      let comment: ParsedComment | undefined;
      let sourceLine = call.line;

      if (/^['"]/.test(call.keyArg)) {
        flagKey = call.keyArg.replace(/^['"]|['"]$/g, '');
      } else {
        const constName = call.keyArg.trim();
        const cm = constMap.get(constName);
        if (cm) {
          flagKey = cm.key;
          comment = cm.comment;
          sourceLine = cm.line;
        }
      }

      if (!flagKey || !this.isValidKey(flagKey)) continue;

      const defaultValue = call.valueArg ? this.parseValue(call.valueArg.trim()) : undefined;
      const lineComment = commentMap.get(call.line) || commentMap.get(call.line - 1);

      const mergedComment: ParsedComment = {
        ...comment,
        ...lineComment,
        description: [comment?.description, lineComment?.description].filter(Boolean).join(' ').trim() || undefined,
      };

      flags.push({
        key: flagKey,
        value: defaultValue ?? null,
        type: detectType(defaultValue ?? null),
        source: 'code',
        file: filePath,
        line: sourceLine,
        owner: mergedComment.owner,
        description: mergedComment.description,
        deprecated: mergedComment.deprecated,
        deprecatedReason: mergedComment.deprecatedReason,
        lastModified: mergedComment.lastModified,
      });
    }

    for (const pattern of this.options.flagPatterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = pattern.exec(content)) !== null) {
        const key = match[1];
        if (!key || !this.isValidKey(key)) continue;

        const lineNumber = this.getLineNumber(content, match.index);
        const defaultValue = match[2] ? this.parseValue(match[2].trim()) : undefined;
        const comment = commentMap.get(lineNumber) || commentMap.get(lineNumber - 1);

        flags.push({
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
        });
      }
    }

    return flags;
  }

  private extractConstMappings(content: string, commentMap: Map<number, ParsedComment>): ConstMapping[] {
    const mappings: ConstMapping[] = [];
    const constPattern = /(?:const|let|var)\s+(FF_[A-Z0-9_]+|FEATURE_[A-Z0-9_]+|FLAG_[A-Z0-9_]+)\s*[:=]\s*['"]([^'"]+)['"]/g;

    let match: RegExpExecArray | null;
    while ((match = constPattern.exec(content)) !== null) {
      const name = match[1];
      const key = match[2];
      const lineNumber = this.getLineNumber(content, match.index);
      const comment = commentMap.get(lineNumber) || commentMap.get(lineNumber - 1);

      mappings.push({
        name,
        key,
        line: lineNumber,
        comment,
      });
    }

    return mappings;
  }

  private extractFunctionCalls(content: string): FunctionCall[] {
    const calls: FunctionCall[] = [];

    const patterns = [
      /(feature[Ff]lag|get[Ff]lag|getBoolean|getString|getInt|getNumber|getObject)\s*\(\s*([^,]+?)(?:\s*,\s*([^)]+?))?\s*\)/g,
    ];

    for (const pattern of patterns) {
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(content)) !== null) {
        const funcName = match[1];
        const keyArg = match[2].trim();
        const valueArg = match[3];
        const lineNumber = this.getLineNumber(content, match.index);

        calls.push({
          funcName,
          keyArg,
          valueArg: valueArg ? valueArg.trim() : undefined,
          line: lineNumber,
        });
      }
    }

    return calls;
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
