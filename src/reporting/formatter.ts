import { stringify } from 'csv-stringify/sync';
import type {
  CheckOptions,
  DiffReport,
  ExtraKey,
  FailOnLevel,
  LengthIssue,
  Locale,
  MissingKey,
  PlaceholderMismatch,
  ReportFormat,
  SeverityLevel,
  StatusIssue,
  ValueDiff,
} from '../types';
import pc from 'picocolors';

const SEVERITY_COLOR: Record<SeverityLevel, (s: string) => string> = {
  error: (s) => pc.red(s),
  warning: (s) => pc.yellow(s),
  info: (s) => pc.cyan(s),
};

const SEVERITY_ICON: Record<SeverityLevel, string> = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
};

const STATUS_COLOR: Record<string, (s: string) => string> = {
  approved: (s) => pc.green(s),
  pending: (s) => pc.yellow(s),
  needs_review: (s) => pc.magenta(s),
  draft: (s) => pc.gray(s),
  deprecated: (s) => pc.red(s),
};

function bar(percent: number, width: number = 20): string {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  const color = percent >= 90 ? pc.green : percent >= 70 ? pc.yellow : pc.red;
  return color('█'.repeat(filled)) + pc.gray('░'.repeat(empty));
}

function pad(s: string, w: number): string {
  const len = [...s].length;
  if (len >= w) return s;
  return s + ' '.repeat(w - len);
}

function makeTable(headers: string[], rows: (string | number)[][]): string {
  const widths = headers.map((h, i) =>
    Math.max(
      h.length,
      ...rows.map((r) => {
        const v = String(r[i] ?? '');
        return [...v].length;
      })
    )
  );
  const hr = widths.map((w) => '─'.repeat(w + 2)).join('┼');
  const formatRow = (r: (string | number)[]) =>
    '│ ' + r.map((v, i) => pad(String(v ?? ''), widths[i])).join(' │ ') + ' │';
  const lines = [
    '┌─' + widths.map((w) => '─'.repeat(w)).join('─┬─') + '─┐',
    formatRow(headers),
    '├─' + hr + '─┤',
    ...rows.map(formatRow),
    '└─' + widths.map((w) => '─'.repeat(w)).join('─┴─') + '─┘',
  ];
  return lines.join('\n');
}

function formatSeverity(level: SeverityLevel, text: string): string {
  return `${SEVERITY_COLOR[level](SEVERITY_ICON[level])} ${text}`;
}

function renderSummary(report: DiffReport): string {
  const lines: string[] = [];
  lines.push(pc.bold(pc.blue('═══ 检查摘要 ═══')));
  lines.push('');
  lines.push(`基准语言: ${pc.bold(report.baseLocale)}`);
  lines.push(`目标语言: ${report.targetLocales.join(', ')}`);
  lines.push(`基准键总数: ${pc.bold(String(report.summary.totalBaseKeys))}`);
  lines.push(`生成时间: ${report.generatedAt}`);
  lines.push('');

  const header = ['语言', '键数', '缺失', '多余', '占位符', '长度', '状态', '完成度'];
  const rows = report.targetLocales.map((loc) => [
    loc,
    report.summary.totalTargetKeys[loc] ?? 0,
    report.summary.missingCount[loc] ?? 0,
    report.summary.extraCount[loc] ?? 0,
    report.summary.placeholderMismatchCount[loc] ?? 0,
    report.summary.lengthIssueCount[loc] ?? 0,
    report.summary.statusIssueCount[loc] ?? 0,
    `${report.summary.completionRate[loc] ?? 0}% ${bar(report.summary.completionRate[loc] ?? 0, 10)}`,
  ]);
  lines.push(makeTable(header, rows));
  return lines.join('\n');
}

function renderMissingKeys(items: MissingKey[], sev: SeverityLevel): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.red(`── 缺失的翻译键 (${items.length}) ──`))];
  for (const it of items) {
    lines.push(
      formatSeverity(
        sev,
        `${pc.bold(it.key)}  缺少于: ${it.missingIn.join(', ')}`
      )
    );
    lines.push(`    ${pc.gray('基准:')} ${it.baseValue.value}`);
    if (it.baseValue.status) {
      lines.push(`    ${pc.gray('基准状态:')} ${(STATUS_COLOR[it.baseValue.status] || String)(it.baseValue.status)}`);
    }
  }
  return lines.join('\n');
}

function renderExtraKeys(items: ExtraKey[], sev: SeverityLevel): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.yellow(`── 多余的翻译键 (${items.length}) ──`))];
  const grouped = new Map<Locale, ExtraKey[]>();
  for (const it of items) {
    if (!grouped.has(it.locale)) grouped.set(it.locale, []);
    grouped.get(it.locale)!.push(it);
  }
  for (const [loc, list] of grouped) {
    lines.push(formatSeverity(sev, `${pc.bold(loc)} (${list.length} 个):`));
    for (const it of list) {
      lines.push(`  ${it.key} = ${it.value.value}`);
    }
  }
  return lines.join('\n');
}

function renderPlaceholderMismatches(items: PlaceholderMismatch[], sev: SeverityLevel): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.red(`── 占位符不匹配 (${items.length}) ──`))];
  for (const it of items) {
    lines.push(
      formatSeverity(
        sev,
        `${pc.bold(it.key)}  (${it.locale})`
      )
    );
    lines.push(`    基准 [${it.basePlaceholders.join(', ') || '无'}]: ${it.baseValue}`);
    lines.push(`    目标 [${it.targetPlaceholders.join(', ') || '无'}]: ${it.targetValue}`);
  }
  return lines.join('\n');
}

function renderLengthIssues(items: LengthIssue[], sevExceed: SeverityLevel, sevShort: SeverityLevel): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.yellow(`── 长度异常 (${items.length}) ──`))];
  for (const it of items) {
    const kind = it.exceeds ? '过长' : '过短';
    const sev = it.exceeds ? sevExceed : sevShort;
    const threshold = it.exceeds ? `> ${it.maxRatio}x` : `< ${it.minRatio}x`;
    lines.push(
      formatSeverity(
        sev,
        `${pc.bold(it.key)}  (${it.locale})  ${kind}  ${threshold}  比率=${it.ratio}x  (${it.baseLength}→${it.targetLength}字符)`
      )
    );
    lines.push(`    基准: ${it.baseValue}`);
    lines.push(`    目标: ${it.targetValue}`);
  }
  return lines.join('\n');
}

function renderStatusIssues(items: StatusIssue[]): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.magenta(`── 审核状态问题 (${items.length}) ──`))];
  for (const it of items) {
    const reasons: string[] = [];
    if (it.isUnapproved) reasons.push('未审核通过');
    if (it.isDeprecated) reasons.push('已废弃');
    if (it.status === 'draft') reasons.push('草稿');
    const sev: SeverityLevel = it.isDeprecated ? 'error' : it.isUnapproved ? 'warning' : 'info';
    lines.push(
      formatSeverity(
        sev,
        `${pc.bold(it.key)}  (${it.locale})  ${(STATUS_COLOR[it.status] || String)(it.status)}  ${reasons.join(', ')}`
      )
    );
  }
  return lines.join('\n');
}

function renderValueDiffs(items: ValueDiff[]): string {
  if (items.length === 0) return '';
  const lines: string[] = ['', pc.bold(pc.cyan(`── 值差异 (${items.length}) ──`))];
  for (const it of items) {
    lines.push(`${pc.bold(it.key)}  有差异的语言: ${it.changedIn.join(', ')}`);
    lines.push(`  基准: ${it.baseValue.value}${it.baseValue.status ? ` [${it.baseValue.status}]` : ''}`);
    for (const loc of it.changedIn) {
      const tv = it.targetValues[loc];
      lines.push(`  ${loc}: ${tv.value}${tv.status ? ` [${tv.status}]` : ''}`);
    }
  }
  return lines.join('\n');
}

export function renderHumanReport(report: DiffReport, opts: CheckOptions): string {
  const sev = opts.severityOverrides;
  const parts: string[] = [];
  parts.push(renderSummary(report));
  parts.push(renderMissingKeys(report.missingKeys, (sev.missingKey || 'error') as SeverityLevel));
  parts.push(renderExtraKeys(report.extraKeys, (sev.extraKey || 'warning') as SeverityLevel));
  parts.push(renderPlaceholderMismatches(report.placeholderMismatches, (sev.placeholderMismatch || 'error') as SeverityLevel));
  parts.push(renderLengthIssues(
    report.lengthIssues,
    (sev.lengthExceeded || 'warning') as SeverityLevel,
    (sev.lengthTooShort || 'info') as SeverityLevel
  ));
  parts.push(renderStatusIssues(report.statusIssues));
  parts.push(renderValueDiffs(report.valueDiffs));
  return parts.filter(Boolean).join('\n') + '\n';
}

export function renderJsonReport(report: DiffReport): string {
  return JSON.stringify(report, null, 2);
}

export function renderCsvReport(report: DiffReport, opts: CheckOptions): string {
  if (opts.csvExportMissing) {
    const rows = report.missingKeys.map((mk) => ({
      key: mk.key,
      baseValue: mk.baseValue.value,
      baseStatus: mk.baseValue.status ?? '',
      comment: mk.baseValue.comment ?? '',
      locales: mk.missingIn.join(';'),
      type: 'missing',
    }));
    for (const pm of report.placeholderMismatches) {
      rows.push({
        key: pm.key,
        baseValue: pm.baseValue,
        baseStatus: '',
        comment: `缺失占位符: ${pm.basePlaceholders.join(',')} / 目标有: ${pm.targetPlaceholders.join(',')}`,
        locales: pm.locale,
        type: 'placeholder_mismatch',
      });
    }
    for (const li of report.lengthIssues) {
      rows.push({
        key: li.key,
        baseValue: li.baseValue,
        baseStatus: '',
        comment: `${li.exceeds ? '过长' : '过短'} 比率=${li.ratio}x (${li.baseLength}→${li.targetLength}字符)`,
        locales: li.locale,
        type: li.exceeds ? 'length_exceeded' : 'length_too_short',
      });
    }
    return stringify(rows, {
      header: true,
      columns: ['key', 'baseValue', 'baseStatus', 'comment', 'locales', 'type'],
    });
  }
  const flatRows: Array<Record<string, string | number>> = [];
  const headerKeys = new Set<string>();
  function addRow(obj: Record<string, string | number>) {
    for (const k of Object.keys(obj)) headerKeys.add(k);
    flatRows.push(obj);
  }
  for (const mk of report.missingKeys) {
    for (const loc of mk.missingIn) {
      addRow({
        issue: 'missing_key',
        key: mk.key,
        locale: loc,
        baseValue: mk.baseValue.value,
        targetValue: '',
        detail: '',
      });
    }
  }
  for (const ek of report.extraKeys) {
    addRow({
      issue: 'extra_key',
      key: ek.key,
      locale: ek.locale,
      baseValue: '',
      targetValue: ek.value.value,
      detail: '',
    });
  }
  for (const pm of report.placeholderMismatches) {
    addRow({
      issue: 'placeholder_mismatch',
      key: pm.key,
      locale: pm.locale,
      baseValue: pm.baseValue,
      targetValue: pm.targetValue,
      detail: `基准:[${pm.basePlaceholders.join(',')}] 目标:[${pm.targetPlaceholders.join(',')}]`,
    });
  }
  return stringify(flatRows, {
    header: true,
    columns: Array.from(headerKeys),
  });
}

export function renderMarkdownReport(report: DiffReport): string {
  const lines: string[] = [];
  lines.push('# 多语言文案差异检查报告');
  lines.push('');
  lines.push(`> 生成时间: ${report.generatedAt}  `);
  lines.push(`> 工具版本: ${report.version}  `);
  lines.push(`> 基准语言: **${report.baseLocale}**  `);
  lines.push(`> 目标语言: ${report.targetLocales.join(', ')}`);
  lines.push('');
  lines.push('## 摘要');
  lines.push('');
  lines.push('| 语言 | 键数 | 缺失 | 多余 | 占位符 | 长度 | 状态 | 完成度 |');
  lines.push('|------|------|------|------|--------|------|------|--------|');
  for (const loc of report.targetLocales) {
    lines.push(
      `| ${loc} | ${report.summary.totalTargetKeys[loc] ?? 0} | ${report.summary.missingCount[loc] ?? 0} | ${report.summary.extraCount[loc] ?? 0} | ${report.summary.placeholderMismatchCount[loc] ?? 0} | ${report.summary.lengthIssueCount[loc] ?? 0} | ${report.summary.statusIssueCount[loc] ?? 0} | ${report.summary.completionRate[loc] ?? 0}% |`
    );
  }
  if (report.missingKeys.length) {
    lines.push('');
    lines.push(`## 缺失键 (${report.missingKeys.length})`);
    lines.push('');
    lines.push('| 键 | 基准值 | 缺失于 |');
    lines.push('|----|--------|--------|');
    for (const mk of report.missingKeys) {
      lines.push(`| \`${mk.key}\` | ${mk.baseValue.value.replace(/\|/g, '\\|')} | ${mk.missingIn.join(', ')} |`);
    }
  }
  if (report.placeholderMismatches.length) {
    lines.push('');
    lines.push(`## 占位符不匹配 (${report.placeholderMismatches.length})`);
    lines.push('');
    lines.push('| 键 | 语言 | 基准占位符 | 目标占位符 |');
    lines.push('|----|------|------------|------------|');
    for (const pm of report.placeholderMismatches) {
      lines.push(`| \`${pm.key}\` | ${pm.locale} | ${pm.basePlaceholders.join(', ') || '无'} | ${pm.targetPlaceholders.join(', ') || '无'} |`);
    }
  }
  return lines.join('\n') + '\n';
}

export function renderReport(report: DiffReport, format: ReportFormat, opts: CheckOptions): string {
  switch (format) {
    case 'json':
      return renderJsonReport(report);
    case 'csv':
      return renderCsvReport(report, opts);
    case 'markdown':
      return renderMarkdownReport(report);
    case 'human':
    default:
      return renderHumanReport(report, opts);
  }
}

export function computeExitCode(report: DiffReport, opts: CheckOptions): number {
  const failOn: FailOnLevel = opts.failOn;
  if (failOn === 'never') return 0;
  const sev = opts.severityOverrides;
  const failLevel = failOn as SeverityLevel;
  const levelOrder: SeverityLevel[] = ['info', 'warning', 'error'];
  const failRank = levelOrder.indexOf(failLevel);

  function reaches(r: string | undefined): boolean {
    const level = (r ?? 'warning') as SeverityLevel;
    return levelOrder.indexOf(level) >= failRank;
  }

  if (report.missingKeys.length && reaches(sev.missingKey)) return 1;
  if (report.extraKeys.length && reaches(sev.extraKey)) return 1;
  if (report.placeholderMismatches.length && reaches(sev.placeholderMismatch)) return 1;
  const lengthErrors = report.lengthIssues.some((li) =>
    reaches(li.exceeds ? sev.lengthExceeded : sev.lengthTooShort)
  );
  if (lengthErrors) return 1;
  const statusErrors = report.statusIssues.some((si) =>
    si.isDeprecated ? reaches(sev.deprecatedStatus)
      : si.isUnapproved ? reaches(sev.unapprovedStatus)
      : reaches(sev.draftStatus)
  );
  if (statusErrors) return 1;
  return 0;
}
