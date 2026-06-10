import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type { CheckOptions, CliArgs, DiffReport, FlatLocaleFile, Locale } from './types';
import { resolveOptions, getVersion } from './config';
import { loadLocaleFile } from './core/loader';
import { runAllChecks } from './core/checker';
import { computeExitCode, renderReport } from './reporting/formatter';
import { runWithConcurrency } from './utils/concurrency';
import pc from 'picocolors';

export interface CheckResult {
  report: DiffReport;
  rendered: string;
  exitCode: number;
  outputFile?: string;
}

export async function runCheck(cliArgs: CliArgs): Promise<CheckResult> {
  const options = resolveOptions(cliArgs);
  const allLocales: Locale[] = [options.base, ...options.locales];

  if (!cliArgs.quiet) {
    console.error(pc.blue(`ℹ i18n-diff v${getVersion()}`));
    if (options.configUsed) {
      console.error(pc.gray(`  使用配置: ${options.configUsed}`));
    }
    console.error(pc.gray(`  基准: ${options.base}  目标: ${options.locales.join(', ')}`));
    console.error(pc.gray(`  并发: ${options.concurrency}  重试: ${options.maxRetries}次`));
    if (cliArgs.verbose) {
      console.error(pc.gray(`  语言目录: ${options.localeDir}`));
      console.error(pc.gray(`  文件模式: ${options.filePattern}`));
      const checks = [];
      if (options.includeMissing) checks.push('缺失');
      if (options.includeExtra) checks.push('多余');
      if (options.includePlaceholder) checks.push('占位符');
      if (options.includeLength) checks.push('长度');
      if (options.includeStatus) checks.push('状态');
      if (options.includeValueDiff) checks.push('值差异');
      console.error(pc.gray(`  启用检查: ${checks.join(', ')}`));
    }
    console.error('');
  }

  const loaded = await runWithConcurrency(
    allLocales,
    (loc) =>
      loadLocaleFile(loc, options.localeDir, options.filePattern, {
        maxRetries: options.maxRetries,
        delay: options.retryDelay,
      }),
    options.concurrency
  );

  const dataMap: Record<Locale, FlatLocaleFile> = {};
  for (const l of loaded) dataMap[l.locale] = l.data;

  const report = runAllChecks({
    baseLocale: options.base,
    targetLocales: options.locales,
    loadedData: dataMap,
    options: {
      includeMissing: options.includeMissing,
      includeExtra: options.includeExtra,
      includePlaceholder: options.includePlaceholder,
      includeLength: options.includeLength,
      includeStatus: options.includeStatus,
      includeValueDiff: options.includeValueDiff,
      placeholderPattern: options.placeholderPattern,
      maxLengthRatio: options.maxLengthRatio,
      minLengthRatio: options.minLengthRatio,
      minLengthThreshold: options.minLengthThreshold,
      requireApproved: options.requireApproved,
      warnOnDraft: options.warnOnDraft,
    },
  });

  const rendered = renderReport(report, options.reportFormat, options);
  let outputFile: string | undefined;

  if (options.outputFile) {
    const absPath = resolve(process.cwd(), options.outputFile);
    const parent = dirname(absPath);
    if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
    writeFileSync(absPath, rendered, 'utf-8');
    outputFile = absPath;
  }

  const exitCode = computeExitCode(report, options);

  return { report, rendered, exitCode, outputFile };
}

export { getVersion, resolveOptions };
export type { CheckOptions, CliArgs, DiffReport };
