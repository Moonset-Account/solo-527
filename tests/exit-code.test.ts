import { describe, it, expect } from 'vitest';
import { computeExitCode } from '../src/reporting/formatter';
import type { CheckOptions, DiffReport } from '../src/types';

const BASE_OPTIONS: CheckOptions = {
  base: 'en',
  locales: ['zh-CN'],
  localeDir: '.',
  filePattern: '{locale}.json',
  includeMissing: true,
  includeExtra: true,
  includePlaceholder: true,
  includeLength: true,
  includeStatus: true,
  includeValueDiff: false,
  placeholderPattern: /\{(\w+)\}/g,
  maxLengthRatio: 1.5,
  minLengthRatio: 0.7,
  minLengthThreshold: 10,
  requireApproved: true,
  warnOnDraft: true,
  severityOverrides: {
    missingKey: 'error',
    extraKey: 'warning',
    placeholderMismatch: 'error',
    lengthExceeded: 'warning',
    lengthTooShort: 'info',
    unapprovedStatus: 'warning',
    draftStatus: 'info',
    deprecatedStatus: 'warning',
  },
  concurrency: 4,
  maxRetries: 3,
  retryDelay: 200,
  failOn: 'error',
  reportFormat: 'human',
  csvExportMissing: true,
  csvExportColumns: [],
};

const EMPTY_REPORT: DiffReport = {
  generatedAt: new Date().toISOString(),
  version: '1.0.0',
  baseLocale: 'en',
  targetLocales: ['zh-CN'],
  summary: {
    totalBaseKeys: 0,
    totalTargetKeys: { 'zh-CN': 0 },
    missingCount: { 'zh-CN': 0 },
    extraCount: { 'zh-CN': 0 },
    placeholderMismatchCount: { 'zh-CN': 0 },
    lengthIssueCount: { 'zh-CN': 0 },
    statusIssueCount: { 'zh-CN': 0 },
    completionRate: { 'zh-CN': 100 },
  },
  missingKeys: [],
  extraKeys: [],
  placeholderMismatches: [],
  lengthIssues: [],
  statusIssues: [],
  valueDiffs: [],
};

describe('退出码计算 (computeExitCode)', () => {
  it('无任何问题时返回 0', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'error' as const };
    expect(computeExitCode(EMPTY_REPORT, opts)).toBe(0);
  });

  it('failOn=never 时任何情况都返回 0', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'never' as const };
    const badReport: DiffReport = {
      ...EMPTY_REPORT,
      missingKeys: [
        { key: 'a', baseValue: { value: 'x' }, missingIn: ['zh-CN'] },
      ],
    };
    expect(computeExitCode(badReport, opts)).toBe(0);
  });

  it('failOn=error 时：缺失键 (error) 返回 1', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'error' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      missingKeys: [
        { key: 'a', baseValue: { value: 'x' }, missingIn: ['zh-CN'] },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });

  it('failOn=error 时：多余键 (warning) 不触发，返回 0', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'error' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      extraKeys: [
        { key: 'legacy.x', locale: 'zh-CN', value: { value: 'x' } },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(0);
  });

  it('failOn=warning 时：多余键 (warning) 触发，返回 1', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'warning' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      extraKeys: [
        { key: 'legacy.x', locale: 'zh-CN', value: { value: 'x' } },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });

  it('failOn=warning 时：长度过短 (info) 不触发，返回 0', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'warning' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      lengthIssues: [
        {
          key: 'k', locale: 'zh-CN', baseLength: 100, targetLength: 50,
          ratio: 0.5, exceeds: false, tooShort: true,
          baseValue: '', targetValue: '', minRatio: 0.7,
        },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(0);
  });

  it('failOn=info 时：长度过短 (info) 触发，返回 1', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'info' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      lengthIssues: [
        {
          key: 'k', locale: 'zh-CN', baseLength: 100, targetLength: 50,
          ratio: 0.5, exceeds: false, tooShort: true,
          baseValue: '', targetValue: '', minRatio: 0.7,
        },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });

  it('占位符不匹配 (error) 在 failOn=error 时触发', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'error' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      placeholderMismatches: [
        {
          key: 'k', locale: 'zh-CN',
          basePlaceholders: ['name'], targetPlaceholders: [],
          baseValue: '', targetValue: '',
        },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });

  it('未审核状态 (warning) 在 failOn=warning 时触发', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'warning' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      statusIssues: [
        {
          key: 'k', locale: 'zh-CN', status: 'pending',
          isUnapproved: true, isDeprecated: false,
        },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });

  it('draft 状态 (info) 只在 failOn=info 时触发', () => {
    const optsErr = { ...BASE_OPTIONS, failOn: 'error' as const };
    const optsWarn = { ...BASE_OPTIONS, failOn: 'warning' as const };
    const optsInfo = { ...BASE_OPTIONS, failOn: 'info' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      statusIssues: [
        {
          key: 'k', locale: 'zh-CN', status: 'draft',
          isUnapproved: false, isDeprecated: false,
        },
      ],
    };
    expect(computeExitCode(report, optsErr)).toBe(0);
    expect(computeExitCode(report, optsWarn)).toBe(0);
    expect(computeExitCode(report, optsInfo)).toBe(1);
  });

  it('deprecated 状态 (warning) 在 failOn=warning 时触发', () => {
    const opts = { ...BASE_OPTIONS, failOn: 'warning' as const };
    const report: DiffReport = {
      ...EMPTY_REPORT,
      statusIssues: [
        {
          key: 'k', locale: 'zh-CN', status: 'deprecated',
          isUnapproved: false, isDeprecated: true,
        },
      ],
    };
    expect(computeExitCode(report, opts)).toBe(1);
  });
});
