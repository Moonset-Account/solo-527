#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { checkI18nDiff, EXIT_CODES } = require('../src/index');
const { OUTPUT_FORMATS } = require('../lib/constants');
const { resolvePath, writeFileSync, parseJson } = require('../lib/file-utils');

const program = new Command();

program
  .name('i18n-diff')
  .description('多语言文案差异检查器 - 检查 JSON 语言包的键对齐、占位符、长度和审核状态')
  .version(require('../package.json').version);

program
  .option('--base <path>', '基准语言包文件路径 (使用 - 表示标准输入)')
  .option('--locale <path>', '目标语言包文件路径 (使用 - 表示标准输入)')
  .option('-b, --base-locale <code>', '基准语言代码', 'en')
  .option('-l, --target-locale <code>', '目标语言代码')
  .option('-m, --missing', '导出缺失的键为 JSON 文件')
  .option('--missing-output <path>', '缺失键输出文件路径', 'missing-keys.json')
  .option('-o, --output <path>', '报告输出文件路径')
  .option('-f, --format <format>', `输出格式: ${Object.values(OUTPUT_FORMATS).join('|')}`, OUTPUT_FORMATS.TEXT)
  .option('--csv <path>', '导出 CSV 格式报告 (快捷方式，等价于 -f csv -o <path>)')
  .option('--json <path>', '导出 JSON 格式报告 (快捷方式，等价于 -f json -o <path>)')
  .option('-s, --strict', '严格模式，将多余键视为错误')
  .option('--fail-on-warnings', '遇到警告时也返回非零退出码')
  .option('--max-length <number>', '最大字符长度限制', parseInt)
  .option('--min-length <number>', '最小字符长度限制', parseInt)
  .option('--require-review', '检查审核状态')
  .option('--placeholder-pattern <regex>', '占位符正则表达式', String)
  .option('-c, --config <path>', '配置文件路径')
  .option('--no-summary', '不显示摘要')
  .option('--quiet', '静默模式，只在有错误时输出')
  .option('--benchmark', '显示性能基准数据');

program.parse(process.argv);

async function main() {
  const options = program.opts();

  let configFile = {};
  if (options.config) {
    const configPath = resolvePath(options.config);
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const parsed = parseJson(configContent, configPath);
      if (parsed.success) {
        configFile = parsed.data;
      } else {
        console.error(`配置文件解析失败: ${parsed.error.message}`);
        process.exit(EXIT_CODES.INVALID_JSON);
      }
    }
  }

  if (options.csv) {
    options.format = OUTPUT_FORMATS.CSV;
    options.output = options.csv;
  }
  if (options.json) {
    options.format = OUTPUT_FORMATS.JSON;
    options.output = options.json;
  }

  if (!options.base || !options.locale) {
    console.error('错误: 必须指定 --base 和 --locale 参数');
    console.error(program.helpInformation());
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  if (!Object.values(OUTPUT_FORMATS).includes(options.format)) {
    console.error(`错误: 无效的输出格式 "${options.format}"，必须是: ${Object.values(OUTPUT_FORMATS).join(', ')}`);
    process.exit(EXIT_CODES.VALIDATION_ERROR);
  }

  try {
    const result = await checkI18nDiff(options.base, options.locale, options, configFile);

    if (!options.quiet) {
      if (options.format === OUTPUT_FORMATS.TEXT && !options.output) {
        console.log(result.getReport(OUTPUT_FORMATS.TEXT));
      } else if (!options.output) {
        console.log(result.getReport(options.format));
      }
    }

    if (options.benchmark && result.performance) {
      console.error(`\n[性能] 执行时间: ${result.performance.durationMs.toFixed(2)}ms`);
    }

    if (options.output) {
      const writeResult = result.writeReport(options.output, options.format);
      if (!writeResult.success) {
        console.error(`写入报告失败: ${writeResult.error.message}`);
        process.exit(EXIT_CODES.PERMISSION_ERROR);
      }
      if (!options.quiet) {
        console.error(`报告已写入: ${writeResult.path}`);
      }
    }

    if (options.missing && result.missingKeys) {
      const missingOutput = resolvePath(options.missingOutput);
      const missingContent = JSON.stringify(result.missingKeys, null, 2);
      const writeResult = writeFileSync(missingOutput, missingContent);
      if (!writeResult.success) {
        console.error(`写入缺失键文件失败: ${writeResult.error.message}`);
        process.exit(EXIT_CODES.PERMISSION_ERROR);
      }
      if (!options.quiet) {
        console.error(`缺失键已导出: ${writeResult.path}`);
      }
    }

    if (result.error && !options.quiet) {
      console.error(`错误: ${result.error.message}`);
      if (result.error.details) {
        console.error(`详情: ${result.error.details}`);
      }
    }

    process.exit(result.exitCode);
  } catch (error) {
    console.error(`执行失败: ${error.message}`);
    process.exit(EXIT_CODES.UNKNOWN_ERROR);
  }
}

main().catch(error => {
  console.error(`未处理的异常: ${error.message}`);
  console.error(error.stack);
  process.exit(EXIT_CODES.UNKNOWN_ERROR);
});
