import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import type { ExportParams } from '../types/index.js';
import { runScan } from './scan.js';
import { runPlan } from './plan.js';
import { Formatter } from '../services/formatter.js';

export async function runExport(params: ExportParams): Promise<void> {
  const scanParams = {
    repo: params.repo,
    days: params.days,
    json: false,
    dryRun: params.dryRun,
    token: params.token,
    defaultBranch: params.defaultBranch,
    remote: params.remote,
    githubOwner: params.githubOwner,
    githubRepo: params.githubRepo,
  };

  Formatter.printHeader(`📤 导出报告 (${params.format.toUpperCase()})`);

  const scan = await runScan(scanParams);
  let deletionPlan = undefined;

  if (params.includePlan) {
    console.log(chalk.cyan('\n📋 包含删除计划...'));
    const planResult = await runPlan({
      ...scanParams,
      json: true,
      confirm: false,
      autoApprove: false,
      outputFile: undefined,
    });
    deletionPlan = planResult.plan || undefined;
  }

  const exportData = scan.analyzer.buildExportData(
    scan.analyzed,
    scanParams,
    deletionPlan
  );

  let content: string = '';
  let actualOutput = params.output;
  const resolvedPath = path.resolve(actualOutput);
  const parentDir = path.dirname(resolvedPath);

  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  let finalFormat = params.format;
  if (!['json', 'csv', 'md'].includes(finalFormat.toLowerCase())) {
    const ext = path.extname(actualOutput).toLowerCase().replace('.', '');
    if (['json', 'csv', 'md'].includes(ext)) {
      finalFormat = ext as 'json' | 'csv' | 'md';
      console.log(chalk.yellow(`根据文件扩展名自动推断格式: ${finalFormat}`));
    }
  }

  switch (finalFormat) {
    case 'json':
      content = Formatter.toJson(exportData);
      if (!resolvedPath.endsWith('.json') && !path.extname(resolvedPath)) {
        actualOutput = resolvedPath + '.json';
      } else {
        actualOutput = resolvedPath;
      }
      break;
    case 'csv':
      content = Formatter.toCSV(exportData);
      if (!resolvedPath.endsWith('.csv') && !path.extname(resolvedPath)) {
        actualOutput = resolvedPath + '.csv';
      } else {
        actualOutput = resolvedPath;
      }
      break;
    case 'md':
      content = Formatter.toMarkdown(exportData, !!params.includePlan);
      if (!resolvedPath.endsWith('.md') && !path.extname(resolvedPath)) {
        actualOutput = resolvedPath + '.md';
      } else {
        actualOutput = resolvedPath;
      }
      break;
    default:
      content = Formatter.toJson(exportData);
      actualOutput = resolvedPath + '.json';
      console.log(chalk.yellow(`未知格式 ${params.format}，回退到 JSON`));
  }

  fs.writeFileSync(actualOutput, content, 'utf8');

  const stats = fs.statSync(actualOutput);
  const sizeKB = (stats.size / 1024).toFixed(1);

  console.log();
  console.log(chalk.green.bold('✅ 导出完成!'));
  console.log(`  文件: ${chalk.cyan(actualOutput)}`);
  console.log(`  格式: ${chalk.cyan(finalFormat.toUpperCase())}`);
  console.log(`  大小: ${chalk.cyan(sizeKB)} KB`);
  console.log(`  分支总数: ${chalk.cyan(exportData.summary.total)}`);
  console.log(`    - 疑似废弃: ${chalk.red(exportData.summary.abandoned)}`);
  console.log(`    - 有未合并提交: ${chalk.yellow(exportData.summary.unmerged)}`);
  console.log(`    - 陈旧: ${chalk.blue(exportData.summary.stale)}`);
  console.log(`    - 活跃: ${chalk.green(exportData.summary.active)}`);
  console.log(`    - 受保护: ${chalk.magenta(exportData.summary.protected)}`);

  if (params.json) {
    const result = {
      outputFile: actualOutput,
      format: finalFormat,
      sizeBytes: stats.size,
      summary: exportData.summary,
    };
    console.log();
    console.log(Formatter.toJson(result));
  }
}
