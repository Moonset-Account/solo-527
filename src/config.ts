import { cosmiconfigSync } from 'cosmiconfig';
import { z } from 'zod';
import type { CheckOptions, CliArgs, ConfigFile, ReportFormat, SeverityLevel } from './types';
import { pkg } from './utils/pkg';

const ConfigSchema = z.object({
  base: z.string().min(2).max(10).optional(),
  locales: z.array(z.string().min(2).max(10)).min(1).optional(),
  localeDir: z.string().min(1).optional(),
  filePattern: z.string().min(1).optional(),
  checks: z.object({
    missing: z.boolean().optional(),
    extra: z.boolean().optional(),
    placeholder: z.boolean().optional(),
    length: z.boolean().optional(),
    status: z.boolean().optional(),
    valueDiff: z.boolean().optional(),
  }).optional(),
  placeholderPattern: z.string().min(1).optional(),
  length: z.object({
    maxRatio: z.number().positive().optional(),
    minRatio: z.number().positive().max(1).optional(),
    minThreshold: z.number().int().nonnegative().optional(),
  }).optional(),
  status: z.object({
    requireApproved: z.boolean().optional(),
    warnOnDraft: z.boolean().optional(),
  }).optional(),
  severity: z.record(z.enum(['error', 'warning', 'info'])).optional(),
  concurrency: z.number().int().positive().max(32).optional(),
  retry: z.object({
    maxRetries: z.number().int().nonnegative().max(10).optional(),
    delay: z.number().int().nonnegative().optional(),
  }).optional(),
  failOn: z.enum(['error', 'warning', 'info', 'never']).optional(),
  report: z.object({
    format: z.enum(['human', 'json', 'csv', 'markdown']).optional(),
    output: z.string().min(1).optional(),
    csv: z.object({
      exportMissing: z.boolean().optional(),
      columns: z.array(z.string().min(1)).optional(),
    }).optional(),
  }).optional(),
}).passthrough();

const DEFAULT_OPTIONS: CheckOptions = {
  base: 'en',
  locales: ['zh-CN', 'ja', 'ko'],
  localeDir: './locales',
  filePattern: '{locale}.json',
  includeMissing: true,
  includeExtra: true,
  includePlaceholder: true,
  includeLength: false,
  includeStatus: false,
  includeValueDiff: false,
  placeholderPattern: /\{(\w+)\}/g,
  maxLengthRatio: 1.5,
  minLengthRatio: 0.7,
  minLengthThreshold: 10,
  requireApproved: false,
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
  csvExportColumns: ['key', 'baseValue', 'status', 'comment', 'locales'],
};

function normalizeSeverity(val: string | undefined): SeverityLevel | 'never' {
  if (val === 'never') return 'never';
  return (val as SeverityLevel) || 'error';
}

function loadConfigFile(configPath?: string): ConfigFile | null {
  const explorer = cosmiconfigSync('i18n-diff', {
    searchPlaces: [
      'i18n-diff.config.json',
      'i18n-diff.config.js',
      'i18n-diff.config.ts',
      '.i18n-diffrc',
      '.i18n-diffrc.json',
      '.i18n-diffrc.js',
      'package.json',
    ],
    packageProp: 'i18nDiff',
  });

  try {
    const result = configPath
      ? explorer.load(configPath)
      : explorer.search();

    if (!result || result.isEmpty) return null;

    const parsed = ConfigSchema.safeParse(result.config);
    if (!parsed.success) {
      const errors = parsed.error.issues.map(
        (i) => `${i.path.join('.')}: ${i.message}`
      ).join('\n  ');
      throw new Error(`配置文件格式错误:\n  ${errors}`);
    }
    return parsed.data;
  } catch (err) {
    if (configPath) {
      throw new Error(`无法加载配置文件 ${configPath}: ${(err as Error).message}`);
    }
    return null;
  }
}

function arrayify<T>(val: T | T[] | undefined): T[] {
  if (val === undefined) return [];
  return Array.isArray(val) ? val : [val];
}

export function resolveOptions(cliArgs: CliArgs): CheckOptions & { configUsed: string | null } {
  const fileConfig = loadConfigFile(cliArgs.config);
  const opts: CheckOptions = { ...DEFAULT_OPTIONS };

  if (fileConfig) {
    if (fileConfig.base) opts.base = fileConfig.base;
    if (fileConfig.locales) opts.locales = fileConfig.locales;
    if (fileConfig.localeDir) opts.localeDir = fileConfig.localeDir;
    if (fileConfig.filePattern) opts.filePattern = fileConfig.filePattern;
    if (fileConfig.placeholderPattern) {
      opts.placeholderPattern = new RegExp(fileConfig.placeholderPattern, 'g');
    }
    if (fileConfig.checks) {
      if (fileConfig.checks.missing !== undefined) opts.includeMissing = fileConfig.checks.missing;
      if (fileConfig.checks.extra !== undefined) opts.includeExtra = fileConfig.checks.extra;
      if (fileConfig.checks.placeholder !== undefined) opts.includePlaceholder = fileConfig.checks.placeholder;
      if (fileConfig.checks.length !== undefined) opts.includeLength = fileConfig.checks.length;
      if (fileConfig.checks.status !== undefined) opts.includeStatus = fileConfig.checks.status;
      if (fileConfig.checks.valueDiff !== undefined) opts.includeValueDiff = fileConfig.checks.valueDiff;
    }
    if (fileConfig.length) {
      if (fileConfig.length.maxRatio !== undefined) opts.maxLengthRatio = fileConfig.length.maxRatio;
      if (fileConfig.length.minRatio !== undefined) opts.minLengthRatio = fileConfig.length.minRatio;
      if (fileConfig.length.minThreshold !== undefined) opts.minLengthThreshold = fileConfig.length.minThreshold;
    }
    if (fileConfig.status) {
      if (fileConfig.status.requireApproved !== undefined) opts.requireApproved = fileConfig.status.requireApproved;
      if (fileConfig.status.warnOnDraft !== undefined) opts.warnOnDraft = fileConfig.status.warnOnDraft;
    }
    if (fileConfig.severity) opts.severityOverrides = { ...opts.severityOverrides, ...fileConfig.severity };
    if (fileConfig.concurrency !== undefined) opts.concurrency = fileConfig.concurrency;
    if (fileConfig.retry) {
      if (fileConfig.retry.maxRetries !== undefined) opts.maxRetries = fileConfig.retry.maxRetries;
      if (fileConfig.retry.delay !== undefined) opts.retryDelay = fileConfig.retry.delay;
    }
    if (fileConfig.failOn !== undefined) opts.failOn = normalizeSeverity(fileConfig.failOn) as SeverityLevel;
    if (fileConfig.report) {
      if (fileConfig.report.format) opts.reportFormat = fileConfig.report.format as ReportFormat;
      if (fileConfig.report.output) opts.outputFile = fileConfig.report.output;
      if (fileConfig.report.csv) {
        if (fileConfig.report.csv.exportMissing !== undefined) opts.csvExportMissing = fileConfig.report.csv.exportMissing;
        if (fileConfig.report.csv.columns) opts.csvExportColumns = fileConfig.report.csv.columns;
      }
    }
  }

  if (cliArgs.base) opts.base = cliArgs.base;
  if (cliArgs.locale !== undefined && arrayify(cliArgs.locale).length > 0) {
    opts.locales = arrayify(cliArgs.locale);
  }
  if (cliArgs.localeDir) opts.localeDir = cliArgs.localeDir;
  if (cliArgs.missing !== undefined) opts.includeMissing = cliArgs.missing;
  if (cliArgs.extra !== undefined) opts.includeExtra = cliArgs.extra;
  if (cliArgs.placeholder !== undefined) opts.includePlaceholder = cliArgs.placeholder;
  if (cliArgs.length !== undefined) opts.includeLength = cliArgs.length;
  if (cliArgs.status !== undefined) opts.includeStatus = cliArgs.status;
  if (cliArgs.valueDiff !== undefined) opts.includeValueDiff = cliArgs.valueDiff;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (cliArgs.allChecks || (cliArgs as { all?: boolean }).all) {
    opts.includeMissing = true;
    opts.includeExtra = true;
    opts.includePlaceholder = true;
    opts.includeLength = true;
    opts.includeStatus = true;
    opts.includeValueDiff = true;
  }
  if (cliArgs.json) opts.reportFormat = 'json';
  if (cliArgs.csv) opts.reportFormat = 'csv';
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  if (cliArgs.md || (cliArgs as { markdown?: boolean }).markdown) opts.reportFormat = 'markdown';
  if (cliArgs.output) opts.outputFile = cliArgs.output;
  if (cliArgs.failOn) opts.failOn = cliArgs.failOn;
  if (cliArgs.concurrency !== undefined) opts.concurrency = Math.min(32, Math.max(1, cliArgs.concurrency));
  if (cliArgs.retries !== undefined) opts.maxRetries = Math.min(10, Math.max(0, cliArgs.retries));
  if ((cliArgs as { pattern?: string }).pattern) opts.filePattern = (cliArgs as { pattern?: string }).pattern!;
  if ((cliArgs as { placeholderPattern?: string }).placeholderPattern) {
    opts.placeholderPattern = new RegExp((cliArgs as { placeholderPattern?: string }).placeholderPattern!, 'g');
  }

  const resolvedLocales = opts.locales.filter((l) => l !== opts.base);
  if (resolvedLocales.length === 0) {
    throw new Error(`目标语言列表不能为空，且不能与基准语言 "${opts.base}" 相同。` +
      `请使用 --locale 指定目标语言，或在配置文件中设置 locales 字段。`);
  }
  opts.locales = resolvedLocales;

  return {
    ...opts,
    configUsed: fileConfig ? (cliArgs.config ?? '自动发现的配置文件') : null,
  };
}

export function getVersion(): string {
  return pkg.version;
}
