import * as fs from 'fs';
import * as path from 'path';
import { detectType } from '../src/utils';
import type { CodeDefaultFlag, FlagValue, ParsedComment as PC } from '../src/types';

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

const filePath = path.join(__dirname, '..', 'examples', 'src', 'app', 'feature-flags.ts');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

function buildCommentMap(lines: string[]): Map<number, ParsedComment> {
  const map = new Map<number, ParsedComment>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const commentMatch = trimmed.match(/^\/\/+\s*(.+)$/);
    if (commentMatch) {
      const text = commentMatch[1].trim();
      const result: ParsedComment = {};
      const ownerMatch = text.match(/(?:owner|负责人|@owner)[:\s]+@?([\w.-]+(?:@[\w.-]+)?)/i);
      if (ownerMatch) result.owner = ownerMatch[1];
      if (/\b(deprecated|废弃)\b/i.test(text)) result.deprecated = true;
      map.set(i + 2, result);
    }
  }
  return map;
}

function extractConstMappings(content: string, commentMap: Map<number, ParsedComment>): ConstMapping[] {
  const mappings: ConstMapping[] = [];
  const constPattern = /(?:const|let|var)\s+(FF_[A-Z0-9_]+|FEATURE_[A-Z0-9_]+|FLAG_[A-Z0-9_]+)\s*[:=]\s*['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = constPattern.exec(content)) !== null) {
    const name = match[1];
    const key = match[2];
    const lineNumber = content.slice(0, match.index).split('\n').length;
    const comment = commentMap.get(lineNumber) || commentMap.get(lineNumber - 1);
    mappings.push({ name, key, line: lineNumber, comment });
  }
  return mappings;
}

function extractFunctionCalls(content: string): FunctionCall[] {
  const calls: FunctionCall[] = [];
  const patterns = [
    /(feature[Ff]lag|get[Ff]lag|getBoolean|getString|getInt|getNumber|getObject)\s*\(\s*([^,]+?)(?:\s*,\s*([^)]+?))?\s*\)/g,
  ];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      calls.push({
        funcName: match[1],
        keyArg: match[2].trim(),
        valueArg: match[3] ? match[3].trim() : undefined,
        line: content.slice(0, match.index).split('\n').length,
      });
    }
  }
  return calls;
}

function parseValue(raw: string): FlagValue {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^['"`]/.test(trimmed)) return trimmed.slice(1, -1);
  const num = Number(trimmed);
  if (!isNaN(num) && trimmed !== '') return num;
  return trimmed;
}

const commentMap = buildCommentMap(lines);
console.log('Comment map size:', commentMap.size);
for (const [line, c] of commentMap) {
  console.log(`  line ${line}: owner=${c.owner || 'none'}, deprecated=${!!c.deprecated}`);
}

const constMappings = extractConstMappings(content, commentMap);
console.log('\nConst mappings:', constMappings.length);
for (const cm of constMappings) {
  console.log(`  ${cm.name} = "${cm.key}" (line ${cm.line}, owner=${cm.comment?.owner || 'none'})`);
}

const functionCalls = extractFunctionCalls(content);
console.log('\nFunction calls:', functionCalls.length);
for (const call of functionCalls) {
  console.log(`  ${call.funcName}(${call.keyArg}, ${call.valueArg || '?'}) at line ${call.line}`);
}

const constMap = new Map<string, ConstMapping>();
for (const cm of constMappings) {
  constMap.set(cm.name, cm);
}

const flags: CodeDefaultFlag[] = [];

console.log('\n--- Adding const flags ---');
for (const cm of constMappings) {
  const flag: CodeDefaultFlag = {
    key: cm.key,
    value: null,
    type: 'null',
    source: 'code',
    file: filePath,
    line: cm.line,
    owner: cm.comment?.owner,
    deprecated: cm.comment?.deprecated,
  };
  console.log(`  ${flag.key}: value=${JSON.stringify(flag.value)}, owner=${flag.owner || 'none'}, line=${flag.line}`);
  flags.push(flag);
}

console.log('\n--- Adding function call flags ---');
for (const call of functionCalls) {
  let flagKey: string | undefined;
  let sourceLine = call.line;

  if (/^['"]/.test(call.keyArg)) {
    flagKey = call.keyArg.replace(/^['"]|['"]$/g, '');
  } else {
    const constName = call.keyArg.trim();
    const cm = constMap.get(constName);
    if (cm) {
      flagKey = cm.key;
      sourceLine = cm.line;
      console.log(`  Resolved ${constName} -> ${flagKey} (from line ${cm.line})`);
    } else {
      console.log(`  Could not resolve const: ${constName}`);
    }
  }

  if (!flagKey) continue;
  if (!/^[\w.-]+$/.test(flagKey)) continue;

  const defaultValue = call.valueArg ? parseValue(call.valueArg) : undefined;
  const flag: CodeDefaultFlag = {
    key: flagKey,
    value: defaultValue ?? null,
    type: detectType(defaultValue ?? null),
    source: 'code',
    file: filePath,
    line: sourceLine,
  };
  console.log(`  ${flag.key}: value=${JSON.stringify(flag.value)} (${flag.type}), line=${flag.line}`);
  flags.push(flag);
}

console.log('\n--- All flags before merge ---');
for (const f of flags) {
  console.log(`  ${f.key}: value=${JSON.stringify(f.value)}, line=${f.line}`);
}

console.log('\n--- Merging by key ---');
const map = new Map<string, CodeDefaultFlag>();
for (const flag of flags) {
  const existing = map.get(flag.key);
  if (!existing) {
    console.log(`  ADD: ${flag.key} = ${JSON.stringify(flag.value)}`);
    map.set(flag.key, { ...flag });
    continue;
  }

  console.log(`  MERGE: ${flag.key} existing=${JSON.stringify(existing.value)}, new=${JSON.stringify(flag.value)}`);
  if (existing.value === null && flag.value !== null) {
    console.log(`    UPDATING value to ${JSON.stringify(flag.value)}`);
    existing.value = flag.value;
    existing.type = flag.type;
  }
  if (!existing.owner && flag.owner) {
    existing.owner = flag.owner;
  }
}

console.log('\n--- Final merged flags ---');
for (const f of map.values()) {
  console.log(`  ${f.key}: value=${JSON.stringify(f.value)} (${f.type}), owner=${f.owner || 'none'}`);
}
