import { existsSync, readFileSync } from 'fs';
import { resolve, join } from 'path';
import type { FlatLocaleFile, Locale, LocaleFile, TranslationValue } from '../types';
import { withRetry } from '../utils/concurrency';

function isNestedObject(val: unknown): val is LocaleFile {
  return (
    typeof val === 'object' &&
    val !== null &&
    !('value' in val) &&
    !('status' in val)
  );
}

function normalizeValue(raw: string | TranslationValue): TranslationValue {
  if (typeof raw === 'string') {
    return { value: raw };
  }
  return {
    value: raw.value ?? '',
    status: raw.status,
    comment: raw.comment,
    updated_at: raw.updated_at,
    translator: raw.translator,
  };
}

function flattenObject(
  obj: LocaleFile,
  prefix: string = '',
  result: FlatLocaleFile = {}
): FlatLocaleFile {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (isNestedObject(val)) {
      flattenObject(val, fullKey, result);
    } else {
      result[fullKey] = normalizeValue(val);
    }
  }
  return result;
}

function resolveFilePath(localeDir: string, filePattern: string, locale: Locale): string {
  const resolvedDir = resolve(process.cwd(), localeDir);
  const fileName = filePattern.replace('{locale}', locale);
  return join(resolvedDir, fileName);
}

export async function loadLocaleFile(
  locale: Locale,
  localeDir: string,
  filePattern: string,
  retryOpts: { maxRetries: number; delay: number }
): Promise<{ locale: Locale; path: string; data: FlatLocaleFile }> {
  const filePath = resolveFilePath(localeDir, filePattern, locale);

  return withRetry(
    // eslint-disable-next-line @typescript-eslint/require-await
    async () => {
      if (!existsSync(filePath)) {
        throw new Error(`语言包文件不存在: ${filePath}`);
      }

      let raw: string;
      try {
        raw = readFileSync(filePath, 'utf-8');
      } catch (err) {
        throw new Error(`无法读取文件 ${filePath}: ${(err as Error).message}`);
      }

      let parsed: LocaleFile;
      try {
        parsed = JSON.parse(raw) as LocaleFile;
      } catch (err) {
        const match = (err as Error).message.match(/position (\d+)/);
        const pos = match ? parseInt(match[1], 10) : -1;
        const context = pos >= 0
          ? `\n  附近内容: ...${raw.slice(Math.max(0, pos - 30), pos + 30)}...`
          : '';
        throw new Error(`JSON 解析失败 (${filePath}): ${(err as Error).message}${context}`);
      }

      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error(`语言包格式错误 (${filePath}): 顶层必须是对象`);
      }

      return {
        locale,
        path: filePath,
        data: flattenObject(parsed),
      };
    },
    {
      maxRetries: retryOpts.maxRetries,
      delay: retryOpts.delay,
      backoff: 'exponential',
    }
  );
}

export function getBaseAndTargetKeys(
  baseData: FlatLocaleFile,
  targetData: FlatLocaleFile
): { allKeys: string[]; baseOnly: string[]; targetOnly: string[]; common: string[] } {
  const baseKeys = new Set(Object.keys(baseData));
  const targetKeys = new Set(Object.keys(targetData));
  const allKeys = Array.from(new Set([...baseKeys, ...targetKeys])).sort();

  const baseOnly: string[] = [];
  const targetOnly: string[] = [];
  const common: string[] = [];

  for (const key of allKeys) {
    const inBase = baseKeys.has(key);
    const inTarget = targetKeys.has(key);
    if (inBase && inTarget) common.push(key);
    else if (inBase) baseOnly.push(key);
    else targetOnly.push(key);
  }

  return { allKeys, baseOnly, targetOnly, common };
}
