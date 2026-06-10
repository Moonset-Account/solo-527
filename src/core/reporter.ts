import * as fs from 'fs';
import chalk from 'chalk';
import { table } from 'table';
import { TestRunReport, TestCaseResult, AssertionResult, TestRunSummary } from '../types';
import { PathUtils } from '../utils/path';
import { logger } from '../utils/logger';

export class ReportGenerator {
  static printConsoleReport(report: TestRunReport): void {
    const { summary, results, collection, environment } = report;

    logger.newline();
    logger.raw(chalk.cyan('╔══════════════════════════════════════════════════════════════╗'));
    logger.raw(chalk.cyan('║                    📊 API 冒烟测试报告                        ║'));
    logger.raw(chalk.cyan('╚══════════════════════════════════════════════════════════════╝'));
    logger.newline();

    logger.raw(chalk.bold(' 集合信息:'));
    logger.raw(`   名称: ${collection.name}`);
    if (collection.version) logger.raw(`   版本: ${collection.version}`);
    if (environment) logger.raw(`   环境: ${environment.name}`);
    logger.raw(`   时间: ${summary.startedAt.toLocaleString()} ~ ${summary.finishedAt.toLocaleString()}`);
    logger.newline();

    this.printSummaryTable(summary);
    logger.newline();

    this.printDetailedResults(results, report);
    logger.newline();

    if (summary.failed > 0) {
      this.printFailedCases(results);
      logger.newline();
    }

    this.printResultBanner(summary);
  }

  private static printSummaryTable(summary: TestRunSummary): void {
    const data = [
      [chalk.bold('指标'), chalk.bold('数值'), chalk.bold('状态')],
      [
        '总用例数',
        String(summary.total),
        summary.total > 0 ? chalk.green('✓') : chalk.yellow('⚠'),
      ],
      [
        '通过',
        String(summary.passed),
        summary.passed > 0 ? chalk.green(String(summary.passed)) : '-',
      ],
      [
        '失败',
        String(summary.failed),
        summary.failed > 0 ? chalk.red(String(summary.failed)) : '-',
      ],
      [
        '跳过',
        String(summary.skipped),
        summary.skipped > 0 ? chalk.gray(String(summary.skipped)) : '-',
      ],
      [
        '总断言数',
        String(summary.totalAssertions),
        '-',
      ],
      [
        '断言通过',
        String(summary.passedAssertions),
        chalk.green(String(summary.passedAssertions)),
      ],
      [
        '断言失败',
        String(summary.failedAssertions),
        summary.failedAssertions > 0 ? chalk.red(String(summary.failedAssertions)) : '-',
      ],
      [
        '耗时',
        `${summary.duration}ms`,
        '-',
      ],
      [
        '成功率',
        `${summary.successRate}%`,
        summary.successRate >= 90
          ? chalk.green(`${summary.successRate}%`)
          : summary.successRate >= 70
          ? chalk.yellow(`${summary.successRate}%`)
          : chalk.red(`${summary.successRate}%`),
      ],
    ];

    const config = {
      columns: [{ width: 14 }, { width: 14 }, { width: 14 }],
      border: {
        topBody: '─', topJoin: '┬', topLeft: '┌', topRight: '┐',
        bottomBody: '─', bottomJoin: '┴', bottomLeft: '└', bottomRight: '┘',
        bodyLeft: '│', bodyRight: '│', bodyJoin: '│',
        joinBody: '─', joinLeft: '├', joinRight: '┤', joinJoin: '┼',
      },
      drawHorizontalLine: (lineIndex: number, rowCount: number) => {
        return lineIndex === 0 || lineIndex === 1 || lineIndex === rowCount;
      },
    };

    process.stdout.write(table(data, config));
  }

  private static printDetailedResults(results: TestCaseResult[], report: TestRunReport): void {
    logger.raw(chalk.bold(' 用例执行详情:'));
    logger.newline();

    for (const result of results) {
      const statusIcon = result.skipped
        ? chalk.gray('⏭')
        : result.passed
        ? chalk.green('✅')
        : chalk.red('❌');

      const statusText = result.skipped
        ? chalk.gray('SKIP')
        : result.passed
        ? chalk.green('PASS')
        : chalk.red('FAIL');

      logger.raw(
        `   ${statusIcon} [${statusText}] ${result.testCase.fullName} ` +
        chalk.gray(`(${result.duration}ms, 重试 ${result.retries} 次)`)
      );

      if (result.response) {
        logger.raw(
          `      ${result.testCase.request.method} ${result.testCase.resolvedUrl} ` +
          `→ HTTP ${result.response.status} (${result.response.responseTime}ms, ${this.formatSize(result.response.size)})`
        );
      }

      for (const assert of result.assertions as AssertionResult[]) {
        if (!assert.passed || report.cliOptions?.verbose) {
          const icon = assert.passed ? chalk.green('├─ ✓') : chalk.red('├─ ✗');
          logger.raw(`      ${icon} [${assert.type}] ${assert.name}: ${assert.message}`);
          if (!assert.passed) {
            logger.raw(chalk.gray(`         期望: ${JSON.stringify(assert.expected)}`));
            logger.raw(chalk.gray(`         实际: ${JSON.stringify(assert.actual)}`));
            if (assert.errorLocation?.file) {
              logger.raw(chalk.gray(`         定位: ${assert.errorLocation.file}${assert.errorLocation.line ? ':' + assert.errorLocation.line : ''}`));
            }
          }
        }
      }

      if (result.error) {
        logger.raw(`      ${chalk.red('├─ 💥 错误:')} ${result.error.message}`);
        if (result.error.stack && report.cliOptions?.verbose) {
          logger.raw(chalk.gray(`         ${result.error.stack.split('\n').slice(0, 3).join('\n         ')}`));
        }
      }
    }
  }

  private static printFailedCases(results: TestCaseResult[]): void {
    const failed = results.filter(r => !r.passed && !r.skipped);
    if (failed.length === 0) return;

    logger.raw(chalk.red.bold(' ❌ 失败用例汇总:'));
    logger.newline();

    for (const result of failed) {
      logger.raw(chalk.red(`   - ${result.testCase.fullName}`));
      if (result.error) {
        logger.raw(`     ${chalk.gray('错误:')} ${result.error.message}`);
      }
      const failedAsserts = (result.assertions as AssertionResult[]).filter(a => !a.passed);
      for (const a of failedAsserts) {
        logger.raw(chalk.gray(`     ↳ [${a.type}] ${a.name}: ${a.message}`));
      }
    }
  }

  private static printResultBanner(summary: TestRunSummary): void {
    const allPassed = summary.failed === 0 && summary.total > 0;
    const hasTests = summary.total > 0;

    let message: string;
    let color: typeof chalk.green;

    if (!hasTests) {
      message = '⚠ 没有执行任何测试用例';
      color = chalk.yellow;
    } else if (allPassed) {
      message = `🎉 所有测试通过！成功率 ${summary.successRate}% (${summary.passed}/${summary.total})`;
      color = chalk.green;
    } else {
      message = `❌ 测试完成 - 失败 ${summary.failed} 个用例, 成功率 ${summary.successRate}%`;
      color = chalk.red;
    }

    const len = Math.max(message.length + 4, 60);
    logger.raw(color.bold(`\n ${'═'.repeat(len)} `));
    logger.raw(color.bold(`   ${message}   `));
    logger.raw(color.bold(` ${'═'.repeat(len)} \n`));
  }

  private static formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  static generateJUnitXML(report: TestRunReport): string {
    const { summary, results, collection, environment } = report;

    const escapeXML = (str: string): string => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    };

    const timestamp = summary.startedAt.toISOString().split('.')[0];
    const timeSec = (summary.duration / 1000).toFixed(3);

    let xml = '';
    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<testsuites name="api-smoke-test" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" time="${timeSec}" timestamp="${timestamp}">\n`;

    const suiteName = escapeXML(environment ? `${collection.name} [${environment.name}]` : collection.name);
    xml += `  <testsuite name="${suiteName}" tests="${summary.total}" failures="${summary.failed}" skipped="${summary.skipped}" errors="0" time="${timeSec}" timestamp="${timestamp}">\n`;

    if (collection.name) {
      xml += `    <properties>\n`;
      xml += `      <property name="collection" value="${escapeXML(collection.name)}"/>\n`;
      if (collection.version) {
        xml += `      <property name="collection.version" value="${escapeXML(collection.version)}"/>\n`;
      }
      if (environment) {
        xml += `      <property name="environment" value="${escapeXML(environment.name)}"/>\n`;
      }
      xml += `      <property name="success.rate" value="${summary.successRate}%"/>\n`;
      xml += `    </properties>\n`;
    }

    for (const result of results) {
      const tc = result.testCase;
      const tcName = escapeXML(tc.fullName);
      const tcClass = escapeXML(tc.folder || collection.name);
      const tcTime = (result.duration / 1000).toFixed(3);

      xml += `    <testcase name="${tcName}" classname="${tcClass}" time="${tcTime}">\n`;

      if (result.skipped) {
        const skipMsg = result.error?.message || 'SKIPPED';
        xml += `      <skipped message="${escapeXML(skipMsg)}"/>\n`;
      } else if (!result.passed) {
        const failedAsserts = (result.assertions as AssertionResult[]).filter(a => !a.passed);
        for (const fail of failedAsserts) {
          const msg = escapeXML(fail.message);
          const detail = `期望: ${JSON.stringify(fail.expected)}\n实际: ${JSON.stringify(fail.actual)}`;
          xml += `      <failure type="${escapeXML(fail.type)}" message="${msg}">\n`;
          xml += `        ${escapeXML(detail)}\n`;
          xml += `      </failure>\n`;
        }

        if (result.error) {
          const errType = escapeXML(result.error.type);
          const errMsg = escapeXML(result.error.message);
          const errDetail = result.error.stack ? escapeXML(result.error.stack) : errMsg;
          xml += `      <error type="${errType}" message="${errMsg}">\n`;
          xml += `        ${errDetail}\n`;
          xml += `      </error>\n`;
        }
      }

      if (result.response) {
        const resp = result.response;
        xml += `      <system-out>\n`;
        xml += `Request: ${tc.request.method} ${tc.resolvedUrl}\n`;
        xml += `Status: HTTP ${resp.status} ${resp.statusText}\n`;
        xml += `Response Time: ${resp.responseTime}ms\n`;
        xml += `Size: ${resp.size} bytes\n`;
        if ((result.assertions as AssertionResult[]).length > 0) {
          xml += `Assertions:\n`;
          for (const a of result.assertions as AssertionResult[]) {
            xml += `  [${a.passed ? '✓' : '✗'}] ${a.type} ${a.name}: ${a.message}\n`;
          }
        }
        xml += `      </system-out>\n`;
      }

      xml += `    </testcase>\n`;
    }

    xml += `  </testsuite>\n`;
    xml += `</testsuites>\n`;

    return xml;
  }

  static writeJUnitFile(report: TestRunReport, outputPath: string): string {
    const xml = this.generateJUnitXML(report);
    const absPath = PathUtils.makeAbsolute(outputPath);
    PathUtils.ensureDir(PathUtils.dirname(absPath));
    fs.writeFileSync(absPath, xml, 'utf-8');
    logger.info(`✅ JUnit XML 报告已写入: ${absPath}`);
    return absPath;
  }

  static generateJSON(report: TestRunReport): string {
    const cleanReport = {
      ...report,
      results: report.results.map(r => ({
        ...r,
        testCase: {
          ...r.testCase,
          resolvedAuth: undefined,
        },
      })),
    };
    return JSON.stringify(cleanReport, null, 2);
  }

  static writeJSONFile(report: TestRunReport, outputPath: string): string {
    const json = this.generateJSON(report);
    const absPath = PathUtils.makeAbsolute(outputPath);
    PathUtils.ensureDir(PathUtils.dirname(absPath));
    fs.writeFileSync(absPath, json, 'utf-8');
    logger.info(`✅ JSON 报告已写入: ${absPath}`);
    return absPath;
  }
}
