import type {
  DiffReport,
  ExtraKey,
  FlatLocaleFile,
  LengthIssue,
  Locale,
  MissingKey,
  PlaceholderMismatch,
  ReviewStatus,
  StatusIssue,
  TranslationValue,
  ValueDiff,
} from '../types';
import { getVersion } from '../config';
import { getBaseAndTargetKeys } from './loader';

export function extractPlaceholders(text: string, pattern: RegExp): string[] {
  const found: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '{') continue;
    let depth = 1;
    let j = i + 1;
    let nestedContent = '';
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}') {
        depth--;
        if (depth === 0) break;
      }
      if (depth > 0) nestedContent += text[j];
      j++;
    }
    if (depth === 0 && j > i) {
      const firstComma = nestedContent.search(/\s*,\s*/);
      const rawName = firstComma >= 0 ? nestedContent.slice(0, firstComma) : nestedContent;
      const name = rawName.trim();

      const altPatternMatch = pattern.exec(`{${name}}`);
      const isValidName = altPatternMatch
        ? altPatternMatch[1] === name
        : /^[A-Za-z_][A-Za-z0-9_]*$/.test(name);

      if (name && isValidName && !seen.has(name)) {
        seen.add(name);
        found.push(name);
      }
      i = j;
    }
  }

  const fallbackNeeded = found.length === 0;
  if (fallbackNeeded) {
    const fallbackMatches = text.match(new RegExp(pattern.source, pattern.flags));
    if (fallbackMatches) {
      for (const m of fallbackMatches) {
        const exec = new RegExp(pattern.source, pattern.flags.replace('g', '')).exec(m);
        const name = exec && exec[1] ? exec[1] : m;
        if (name && !seen.has(name)) {
          seen.add(name);
          found.push(name);
        }
      }
    }
  }

  return found.sort();
}

function arraysEqualAsSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  const sb = new Set(b);
  if (sa.size !== sb.size) return false;
  for (const x of sa) if (!sb.has(x)) return false;
  return true;
}

function truncate(s: string, max: number = 60): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface RunChecksParams {
  baseLocale: Locale;
  targetLocales: Locale[];
  loadedData: Record<Locale, FlatLocaleFile>;
  options: {
    includeMissing: boolean;
    includeExtra: boolean;
    includePlaceholder: boolean;
    includeLength: boolean;
    includeStatus: boolean;
    includeValueDiff: boolean;
    placeholderPattern: RegExp;
    maxLengthRatio: number;
    minLengthRatio: number;
    minLengthThreshold: number;
    requireApproved: boolean;
    warnOnDraft: boolean;
  };
}

export function runAllChecks(params: RunChecksParams): DiffReport {
  const { baseLocale, targetLocales, loadedData, options } = params;
  const baseData = loadedData[baseLocale];
  const baseKeys = Object.keys(baseData);

  const report: DiffReport = {
    generatedAt: new Date().toISOString(),
    version: getVersion(),
    baseLocale,
    targetLocales,
    summary: {
      totalBaseKeys: baseKeys.length,
      totalTargetKeys: {} as Record<Locale, number>,
      missingCount: {} as Record<Locale, number>,
      extraCount: {} as Record<Locale, number>,
      placeholderMismatchCount: {} as Record<Locale, number>,
      lengthIssueCount: {} as Record<Locale, number>,
      statusIssueCount: {} as Record<Locale, number>,
      completionRate: {} as Record<Locale, number>,
    },
    missingKeys: [],
    extraKeys: [],
    placeholderMismatches: [],
    lengthIssues: [],
    statusIssues: [],
    valueDiffs: [],
  };

  const missingKeyMap = new Map<string, MissingKey>();

  for (const locale of targetLocales) {
    const targetData = loadedData[locale];
    const targetKeys = Object.keys(targetData);
    const { baseOnly, targetOnly, common } = getBaseAndTargetKeys(baseData, targetData);

    report.summary.totalTargetKeys[locale] = targetKeys.length;
    report.summary.missingCount[locale] = 0;
    report.summary.extraCount[locale] = 0;
    report.summary.placeholderMismatchCount[locale] = 0;
    report.summary.lengthIssueCount[locale] = 0;
    report.summary.statusIssueCount[locale] = 0;

    if (options.includeMissing) {
      for (const key of baseOnly) {
        const existing = missingKeyMap.get(key);
        if (existing) {
          existing.missingIn.push(locale);
        } else {
          missingKeyMap.set(key, {
            key,
            baseValue: baseData[key],
            missingIn: [locale],
          });
        }
        report.summary.missingCount[locale]++;
      }
    }

    if (options.includeExtra) {
      for (const key of targetOnly) {
        const extra: ExtraKey = {
          key,
          locale,
          value: targetData[key],
        };
        report.extraKeys.push(extra);
        report.summary.extraCount[locale]++;
      }
    }

    if (options.includePlaceholder) {
      for (const key of common) {
        const baseVal = baseData[key].value;
        const targetVal = targetData[key].value;
        const basePh = extractPlaceholders(baseVal, options.placeholderPattern);
        const targetPh = extractPlaceholders(targetVal, options.placeholderPattern);
        if (!arraysEqualAsSet(basePh, targetPh)) {
          const mis: PlaceholderMismatch = {
            key,
            locale,
            basePlaceholders: basePh,
            targetPlaceholders: targetPh,
            baseValue: truncate(baseVal),
            targetValue: truncate(targetVal),
          };
          report.placeholderMismatches.push(mis);
          report.summary.placeholderMismatchCount[locale]++;
        }
      }
    }

    if (options.includeLength) {
      for (const key of common) {
        const baseVal = baseData[key].value;
        const targetVal = targetData[key].value;
        const baseLen = baseVal.length;
        if (baseLen < options.minLengthThreshold) continue;
        const targetLen = targetVal.length;
        const ratio = baseLen === 0 ? 1 : targetLen / baseLen;
        const exceeds = ratio > options.maxLengthRatio;
        const tooShort = ratio < options.minLengthRatio;
        if (exceeds || tooShort) {
          const issue: LengthIssue = {
            key,
            locale,
            baseLength: baseLen,
            targetLength: targetLen,
            ratio: Number(ratio.toFixed(2)),
            exceeds,
            tooShort,
            baseValue: truncate(baseVal),
            targetValue: truncate(targetVal),
            maxRatio: exceeds ? options.maxLengthRatio : undefined,
            minRatio: tooShort ? options.minLengthRatio : undefined,
          };
          report.lengthIssues.push(issue);
          report.summary.lengthIssueCount[locale]++;
        }
      }
    }

    if (options.includeStatus) {
      for (const key of common) {
        const tv = targetData[key];
        const bv = baseData[key];
        const status = (tv.status ?? 'pending') as ReviewStatus;
        const isUnapproved = options.requireApproved && status !== 'approved';
        const isDeprecated = status === 'deprecated';
        const isDraft = status === 'draft' && options.warnOnDraft;
        if (isUnapproved || isDeprecated || isDraft) {
          const issue: StatusIssue = {
            key,
            locale,
            status,
            isUnapproved,
            isDeprecated,
            baseStatus: bv.status as ReviewStatus,
          };
          report.statusIssues.push(issue);
          report.summary.statusIssueCount[locale]++;
        }
      }
    }

    if (options.includeValueDiff) {
      for (const key of common) {
        const bv: TranslationValue = baseData[key];
        const tv: TranslationValue = targetData[key];
        const isDiff =
          bv.value !== tv.value ||
          bv.status !== tv.status ||
          bv.comment !== tv.comment;
        if (isDiff) {
          const existing = report.valueDiffs.find((d): d is ValueDiff => d.key === key);
          if (existing) {
            existing.changedIn.push(locale);
            existing.targetValues[locale] = tv;
          } else {
            report.valueDiffs.push({
              key,
              changedIn: [locale],
              baseValue: bv,
              targetValues: { [locale]: tv },
            });
          }
        }
      }
    }

    const presentKeys = common.length + (options.includeExtra ? targetOnly.length : 0);
    const totalNeeded = baseKeys.length;
    report.summary.completionRate[locale] = totalNeeded === 0
      ? 100
      : Number(((common.length / totalNeeded) * 100).toFixed(1));
    void presentKeys;
  }

  report.missingKeys = Array.from(missingKeyMap.values()).sort((a, b) =>
    a.key.localeCompare(b.key)
  );

  return report;
}
