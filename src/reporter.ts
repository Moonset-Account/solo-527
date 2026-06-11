import Table from 'cli-table3';
import chalk from 'chalk';
import builder from 'junit-report-builder';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { RunReport, TestResult, TestStatus } from './types';

function getStatusIcon(status: TestStatus, noColor: boolean): string {
  if (noColor) {
    switch (status) {
      case 'passed': return '[PASS]';
      case 'failed': return '[FAIL]';
      case 'skipped': return '[SKIP]';
      case 'error': return '[ERR ]';
    }
  }
  switch (status) {
    case 'passed': return chalk.green('✓');
    case 'failed': return chalk.red('✗');
    case 'skipped': return chalk.gray('○');
    case 'error': return chalk.red('✕');
  }
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function printTableReport(report: RunReport, verbose: boolean, noColor: boolean): void {
  const c = noColor ? (s: string) => s : (s: string) => s;

  const header = chalk ? `${chalk.bold('API 冒烟测试报告')}  v${report.cliVersion}` : `API 冒烟测试报告  v${report.cliVersion}`;
  console.log(c(header));
  console.log(c(`${chalk.dim('集合:')} ${report.collectionName} (v${report.collectionVersion})`));
  if (report.environment) {
    console.log(c(`${chalk.dim('环境:')} ${report.environment}`));
  }
  console.log(c(`${chalk.dim('时间:')} ${report.summary.startedAt} → ${report.summary.finishedAt}`));
  console.log(c(`${chalk.dim('配置:')} 并发=${report.config.parallel}, 重试=${report.config.retryMaxAttempts}次, 超时=${report.config.timeoutMs}ms`));
  console.log('');

  const table = new Table({
    head: [
      noColor ? '状态' : chalk.bold('状态'),
      noColor ? '用例ID' : chalk.bold('用例ID'),
      noColor ? '用例名称' : chalk.bold('用例名称'),
      noColor ? 'HTTP' : chalk.bold('HTTP'),
      noColor ? '状态码' : chalk.bold('状态码'),
      noColor ? '耗时' : chalk.bold('耗时'),
      noColor ? '重试' : chalk.bold('重试'),
    ],
    colWidths: [8, 18, 40, 8, 10, 10, 8],
    wordWrap: true,
  });

  for (const result of report.results) {
    const color = noColor
      ? (s: string) => s
      : result.status === 'passed'
        ? chalk.green
        : result.status === 'skipped'
          ? chalk.gray
          : chalk.red;

    table.push([
      getStatusIcon(result.status, noColor),
      color(result.id),
      color(result.name),
      '',
      result.statusCode ? String(result.statusCode) : '-',
      formatTime(result.responseTimeMs),
      result.totalAttempts > 1 ? `${result.totalAttempts}次` : '-',
    ]);
  }

  console.log(table.toString());
  console.log('');

  if (verbose) {
    printVerboseFailures(report, noColor);
  } else {
    printSummaryFailures(report, noColor);
  }

  printSummary(report, noColor);
}

function printSummaryFailures(report: RunReport, noColor: boolean): void {
  const failedResults = report.results.filter(
    (r) => r.status === 'failed' || r.status === 'error'
  );

  if (failedResults.length === 0) return;

  const header = noColor
    ? '失败详情 (使用 --verbose 查看完整信息)'
    : chalk.bold.red('失败详情 (使用 --verbose 查看完整信息)');
  console.log(header);
  console.log('─'.repeat(80));

  for (const result of failedResults) {
    printSingleFailure(result, noColor, false);
  }
}

function printVerboseFailures(report: RunReport, noColor: boolean): void {
  const failedResults = report.results.filter(
    (r) => r.status === 'failed' || r.status === 'error'
  );

  if (failedResults.length === 0) return;

  const header = noColor
    ? '失败详情'
    : chalk.bold.red('失败详情');
  console.log(header);
  console.log('─'.repeat(80));

  for (const result of failedResults) {
    printSingleFailure(result, noColor, true);
  }
}

function printSingleFailure(result: TestResult, noColor: boolean, verbose: boolean): void {
  const c = noColor ? (s: string) => s : (s: string) => s;
  const red = noColor ? (s: string) => s : chalk.red;
  const yellow = noColor ? (s: string) => s : chalk.yellow;
  const dim = noColor ? (s: string) => s : chalk.dim;

  console.log('');
  console.log(c(`${red('●')} [${result.id}] ${result.name}`));

  if (result.error) {
    console.log(c(`  ${red('错误类型:')} ${result.error.type}`));
    console.log(c(`  ${red('错误信息:')} ${result.error.message}`));
    if (result.error.suggestion) {
      console.log(c(`  ${yellow('建议动作:')} ${result.error.suggestion}`));
    }
  }

  if (result.failedAssertions.length > 0) {
    for (const [idx, assertion] of result.failedAssertions.entries()) {
      console.log(c(`  ${red(`断言 ${idx + 1}: ${assertion.type}`)}`));
      console.log(c(`    ${dim('原因:')} ${assertion.message}`));
      if (assertion.expected !== undefined) {
        const exp = typeof assertion.expected === 'string' ? assertion.expected : JSON.stringify(assertion.expected);
        console.log(c(`    ${dim('期望:')} ${exp}`));
      }
      if (assertion.actual !== undefined) {
        const act = typeof assertion.actual === 'string' ? assertion.actual : JSON.stringify(assertion.actual);
        console.log(c(`    ${dim('实际:')} ${act}`));
      }
      if (assertion.suggestion) {
        console.log(c(`    ${yellow('建议:')} ${assertion.suggestion}`));
      }
    }
  }

  if (verbose && result.attempts.length > 1) {
    console.log(c(`  ${dim('重试历史:')}`));
    for (const attempt of result.attempts) {
      const status = attempt.error ? 'ERR' : attempt.assertionResults.every((a) => a.passed) ? 'OK' : 'FAIL';
      console.log(c(`    第${attempt.attempt}次: [${status}] 状态码=${attempt.statusCode || '-'} 耗时=${formatTime(attempt.responseTimeMs)}`));
      if (attempt.error) {
        console.log(c(`      错误: ${attempt.error}`));
      }
    }
  }

  if (verbose && result.tags && result.tags.length > 0) {
    console.log(c(`  ${dim('标签:')} ${result.tags.join(', ')}`));
  }
}

function printSummary(report: RunReport, noColor: boolean): void {
  const { total, passed, failed, skipped, errors, totalTimeMs } = report.summary;
  const c = noColor ? (s: string) => s : (s: string) => s;
  const green = noColor ? (s: string) => s : chalk.green;
  const red = noColor ? (s: string) => s : chalk.red;
  const gray = noColor ? (s: string) => s : chalk.gray;
  const bold = noColor ? (s: string) => s : chalk.bold;

  console.log('');
  const summaryBar = '═'.repeat(80);
  console.log(c(summaryBar));
  console.log(c(bold('结果汇总')));
  console.log(c(`  总数: ${total}  |  ${green('通过: ' + passed)}  |  ${red('失败: ' + failed)}  |  ${red('错误: ' + errors)}  |  ${gray('跳过: ' + skipped)}`));
  console.log(c(`  通过率: ${total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0'}%  |  总耗时: ${formatTime(totalTimeMs)}`));

  const allPassed = failed === 0 && errors === 0 && total > 0;
  console.log(c(summaryBar));
  if (allPassed) {
    console.log(c(green(bold('  ✓ 全部通过 - API 冒烟测试成功!'))));
  } else if (total === 0) {
    console.log(c(red(bold('  ✗ 没有执行任何测试用例'))));
  } else {
    const failedCount = failed + errors;
    console.log(c(red(bold(`  ✗ 存在 ${failedCount} 个失败 - 请查看上方详情排查`))));
  }
  console.log(c(summaryBar));
}

export function writeJsonReport(report: RunReport, outputPath?: string): void {
  const json = JSON.stringify(report, null, 2);
  if (outputPath) {
    const absolutePath = resolve(outputPath);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, json, 'utf-8');
  } else {
    console.log(json);
  }
}

export function writeJUnitReport(report: RunReport, outputPath: string): void {
  const suite = builder
    .testSuite()
    .name(`${report.collectionName} - API Smoke Tests`)
    .timestamp(report.summary.startedAt)
    .time(report.summary.totalTimeMs / 1000)
    .property('collection', report.collectionName)
    .property('collectionVersion', report.collectionVersion)
    .property('cliVersion', report.cliVersion)
    .property('parallel', String(report.config.parallel))
    .property('retryMaxAttempts', String(report.config.retryMaxAttempts));

  if (report.environment) {
    suite.property('environment', report.environment);
  }

  for (const result of report.results) {
    const testCase = suite
      .testCase()
      .className(result.id)
      .name(result.name)
      .time(result.responseTimeMs / 1000);

    if (result.tags && result.tags.length > 0) {
      testCase.property('tags', result.tags.join(','));
    }

    if (result.statusCode) {
      testCase.property('statusCode', String(result.statusCode));
    }
    if (result.totalAttempts > 1) {
      testCase.property('attempts', String(result.totalAttempts));
    }

    if (result.status === 'skipped') {
      testCase.skipped();
    } else if (result.status === 'error' && result.error) {
      const messageParts = [result.error.message];
      if (result.error.suggestion) {
        messageParts.push(`建议: ${result.error.suggestion}`);
      }
      testCase.error(result.error.type, messageParts.join('\n'));
    } else if (result.status === 'failed') {
      const failureMessages: string[] = [];
      for (const assertion of result.failedAssertions) {
        const parts = [`[${assertion.type}] ${assertion.message}`];
        if (assertion.expected !== undefined) {
          parts.push(`  期望: ${JSON.stringify(assertion.expected)}`);
        }
        if (assertion.actual !== undefined) {
          parts.push(`  实际: ${JSON.stringify(assertion.actual)}`);
        }
        if (assertion.suggestion) {
          parts.push(`  建议: ${assertion.suggestion}`);
        }
        failureMessages.push(parts.join('\n'));
      }
      testCase.failure(
        `${result.failedAssertions.length} 个断言失败`,
        failureMessages.join('\n\n')
      );
    }
  }

  const absolutePath = resolve(outputPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  builder.writeTo(absolutePath);
}

export function printLoadErrors(errors: Array<{ type: string; message: string; path?: string; suggestion?: string }>, noColor: boolean): void {
  const c = noColor ? (s: string) => s : (s: string) => s;
  const red = noColor ? (s: string) => s : chalk.red;
  const yellow = noColor ? (s: string) => s : chalk.yellow;
  const bold = noColor ? (s: string) => s : chalk.bold;

  console.log(c(red(bold('配置加载失败'))));
  console.log(c('─'.repeat(80)));
  console.log('');

  for (const [idx, error] of errors.entries()) {
    console.log(c(`${red(`[${idx + 1}]`)} ${error.type.toUpperCase()}${error.path ? ` @ ${error.path}` : ''}`));
    console.log(c(`  ${error.message}`));
    if (error.suggestion) {
      console.log(c(`  ${yellow('💡 ' + error.suggestion)}`));
    }
    console.log('');
  }
}

export function printVersion(version: string, noColor: boolean): void {
  const bold = noColor ? (s: string) => s : chalk.bold;
  console.log(bold(`smoke-api v${version}`));
  console.log('API 冒烟测试命令行工具 - 面向测试工程师的日常工作流');
}

export function printHelpTips(noColor: boolean): void {
  const c = noColor ? (s: string) => s : (s: string) => s;
  const dim = noColor ? (s: string) => s : chalk.dim;
  console.log('');
  console.log(c(dim('示例:')));
  console.log(c(dim('  smoke-api --collection ./collection.json --env ./env-dev.json --parallel 5')));
  console.log(c(dim('  smoke-api -c collection.yaml -j report.json --junit junit.xml --parallel 10')));
  console.log(c(dim('  smoke-api --dry-run -c collection.json')));
}
