export type Locale = string;

export type ReviewStatus = 'approved' | 'pending' | 'needs_review' | 'draft' | 'deprecated';

export interface TranslationValue {
  value: string;
  status?: ReviewStatus;
  comment?: string;
  updated_at?: string;
  translator?: string;
}

export type LocaleFile = Record<string, string | TranslationValue>;

export type FlatLocaleFile = Record<string, TranslationValue>;

export interface MissingKey {
  key: string;
  baseValue: TranslationValue;
  missingIn: Locale[];
}

export interface ExtraKey {
  key: string;
  locale: Locale;
  value: TranslationValue;
}

export interface PlaceholderMismatch {
  key: string;
  locale: Locale;
  basePlaceholders: string[];
  targetPlaceholders: string[];
  baseValue: string;
  targetValue: string;
}

export interface LengthIssue {
  key: string;
  locale: Locale;
  baseLength: number;
  targetLength: number;
  ratio: number;
  exceeds: boolean;
  tooShort: boolean;
  baseValue: string;
  targetValue: string;
  maxRatio?: number;
  minRatio?: number;
}

export interface StatusIssue {
  key: string;
  locale: Locale;
  status: ReviewStatus;
  isUnapproved: boolean;
  isDeprecated: boolean;
  baseStatus?: ReviewStatus;
}

export interface ValueDiff {
  key: string;
  changedIn: Locale[];
  baseValue: TranslationValue;
  targetValues: Record<Locale, TranslationValue>;
}

export interface DiffReport {
  generatedAt: string;
  version: string;
  baseLocale: Locale;
  targetLocales: Locale[];
  summary: {
    totalBaseKeys: number;
    totalTargetKeys: Record<Locale, number>;
    missingCount: Record<Locale, number>;
    extraCount: Record<Locale, number>;
    placeholderMismatchCount: Record<Locale, number>;
    lengthIssueCount: Record<Locale, number>;
    statusIssueCount: Record<Locale, number>;
    completionRate: Record<Locale, number>;
  };
  missingKeys: MissingKey[];
  extraKeys: ExtraKey[];
  placeholderMismatches: PlaceholderMismatch[];
  lengthIssues: LengthIssue[];
  statusIssues: StatusIssue[];
  valueDiffs: ValueDiff[];
}

export type ReportFormat = 'human' | 'json' | 'csv' | 'markdown';

export type SeverityLevel = 'error' | 'warning' | 'info';
export type FailOnLevel = SeverityLevel | 'never';

export interface CheckOptions {
  base: Locale;
  locales: Locale[];
  localeDir: string;
  filePattern: string;
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
  severityOverrides: Record<string, SeverityLevel>;
  concurrency: number;
  maxRetries: number;
  retryDelay: number;
  failOn: FailOnLevel;
  reportFormat: ReportFormat;
  outputFile?: string;
  csvExportMissing: boolean;
  csvExportColumns: string[];
}

export interface ConfigFile {
  base?: Locale;
  locales?: Locale[];
  localeDir?: string;
  filePattern?: string;
  checks?: {
    missing?: boolean;
    extra?: boolean;
    placeholder?: boolean;
    length?: boolean;
    status?: boolean;
    valueDiff?: boolean;
  };
  placeholderPattern?: string;
  length?: {
    maxRatio?: number;
    minRatio?: number;
    minThreshold?: number;
  };
  status?: {
    requireApproved?: boolean;
    warnOnDraft?: boolean;
  };
  severity?: Record<string, SeverityLevel>;
  concurrency?: number;
  retry?: {
    maxRetries?: number;
    delay?: number;
  };
  failOn?: FailOnLevel;
  report?: {
    format?: ReportFormat;
    output?: string;
    csv?: {
      exportMissing?: boolean;
      columns?: string[];
    };
  };
}

export interface CliArgs {
  base?: Locale;
  locale?: Locale | Locale[];
  localeDir?: string;
  config?: string;
  missing?: boolean;
  extra?: boolean;
  placeholder?: boolean;
  length?: boolean;
  status?: boolean;
  valueDiff?: boolean;
  allChecks?: boolean;
  json?: boolean;
  csv?: boolean;
  md?: boolean;
  output?: string;
  failOn?: FailOnLevel;
  concurrency?: number;
  retries?: number;
  quiet?: boolean;
  verbose?: boolean;
}
