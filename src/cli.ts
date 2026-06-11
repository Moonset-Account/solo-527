#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import { CliArgs, EXIT_CODES } from './types';
import { loadCollection, loadEnvironment, mergeAndInterpolate, LoadError } from './loader';
import { runCollection, determineExitCode, buildDryRunReport } from './executor';
import {
  printTableReport,
  writeJsonReport,
  writeJUnitReport,
  printLoadErrors,
  printVersion,
  printHelpTips,
} from './reporter';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const pkgPath = path.resolve(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

function buildYargs(): Promise<CliArgs> {
  return yargs(hideBin(process.argv))
    .scriptName('smoke-api')
    .usage('$0 [选项]', '执行 API 冒烟测试')
    .example('$0 --collection ./collection.json --env ./env-dev.json --parallel 5', '使用环境变量并发执行测试')
    .example('$0 -c collection.yaml -j report.json --junit junit.xml --parallel 10', '输出 JSON 和 JUnit 报告')
    .example('$0 --dry-run -c collection.json', '仅加载和校验配置，不发起请求')

    .option('collection', {
      alias: 'c',
      type: 'string',
      demandOption: true,
      describe: '接口集合文件路径 (.json/.yaml/.yml)',
      nargs: 1,
    })
    .option('env', {
      alias: 'e',
      type: 'string',
      describe: '环境变量文件路径 (.json/.yaml/.yml)',
      nargs: 1,
    })
    .option('parallel', {
      alias: 'p',
      type: 'number',
      default: 1,
      describe: '并发执行数 (1-100)',
      nargs: 1,
    })
    .option('retry', {
      alias: 'r',
      type: 'number',
      default: 1,
      describe: '失败重试最大次数 (1-10)',
      nargs: 1,
    })
    .option('timeout', {
      alias: 't',
      type: 'number',
      describe: '单个请求超时时间 (毫秒)',
      nargs: 1,
    })
    .option('junit', {
      type: 'string',
      describe: '输出 JUnit XML 报告到指定文件',
      nargs: 1,
    })
    .option('json', {
      alias: 'j',
      type: 'boolean',
      default: false,
      describe: '以 JSON 格式输出机器可读报告',
    })
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'JSON 报告输出文件路径 (默认 stdout)',
      nargs: 1,
    })
    .option('report', {
      type: 'string',
      describe: '目录报告输出目录',
      nargs: 1,
    })
    .option('dry-run', {
      type: 'boolean',
      default: false,
      describe: '仅加载和校验配置，不发起实际请求',
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: '详细输出失败用例的完整信息',
    })
    .option('tags', {
      type: 'array',
      string: true,
      describe: '按标签过滤测试用例 (可指定多个)',
      nargs: 1,
    })
    .option('filter', {
      alias: 'f',
      type: 'string',
      describe: '按名称/ID 正则过滤测试用例',
      nargs: 1,
    })
    .option('fail-fast', {
      type: 'boolean',
      default: false,
      describe: '遇到首个失败立即停止执行',
    })
    .option('delay', {
      type: 'number',
      describe: '串行模式下用例间延迟 (毫秒)',
      nargs: 1,
    })
    .option('color', {
      type: 'boolean',
      default: true,
      describe: '启用彩色输出 (使用 --no-color 禁用)',
    })
    .option('version', {
      type: 'boolean',
      default: false,
      describe: '显示版本号',
    })

    .check((argv) => {
      if (argv.parallel < 1 || argv.parallel > 100) {
        throw new Error('--parallel 参数必须在 1-100 范围内');
      }
      if (argv.retry < 1 || argv.retry > 10) {
        throw new Error('--retry 参数必须在 1-10 范围内');
      }
      if (argv.timeout !== undefined && argv.timeout < 1) {
        throw new Error('--timeout 参数必须为正整数');
      }
      if (argv.delay !== undefined && argv.delay < 0) {
        throw new Error('--delay 参数不能为负数');
      }
      return true;
    })

    .strict()
    .wrap(null)
    .parseAsync() as Promise<CliArgs>;
}

function detectCiNoColor(): boolean {
  return !!(
    process.env.CI ||
    process.env.GITHUB_ACTIONS ||
    process.env.GITLAB_CI ||
    process.env.JENKINS_URL ||
    process.env.TEAMCITY_VERSION ||
    process.env.NO_COLOR
  );
}

async function main(): Promise<number> {
  try {
    const argv = await buildYargs();

    if (argv.version) {
      printVersion(pkg.version, !argv.color || detectCiNoColor());
      return EXIT_CODES.SUCCESS;
    }

    const noColor = !argv.color || detectCiNoColor();

    const collectionResult = loadCollection(argv.collection);
    if (!collectionResult.success || !collectionResult.data) {
      printLoadErrors(collectionResult.errors as LoadError[], noColor);
      return EXIT_CODES.CONFIG_ERROR;
    }

    const envResult = loadEnvironment(argv.env);
    if (!envResult.success) {
      printLoadErrors(envResult.errors as LoadError[], noColor);
      return EXIT_CODES.CONFIG_ERROR;
    }

    const collection = mergeAndInterpolate(collectionResult.data, envResult.data);
    if (!collection.success || !collection.data) {
      printLoadErrors(collection.errors as LoadError[], noColor);
      return EXIT_CODES.CONFIG_ERROR;
    }

    let report;
    if (argv.dryRun) {
      report = buildDryRunReport(collection.data, argv, pkg.version);
    } else {
      report = await runCollection(collection.data, argv, pkg.version);
    }

    if (argv.junit) {
      writeJUnitReport(report, argv.junit);
    }

    if (argv.json) {
      writeJsonReport(report, argv.output);
    }

    if (!argv.json) {
      if (argv.dryRun) {
        const bold = noColor ? (s: string) => s : chalk.bold;
        const cyan = noColor ? (s: string) => s : chalk.cyan;
        console.log(bold(cyan('DRY-RUN 模式 - 配置校验通过，未发起请求')));
        console.log('');
      }
      printTableReport(report, argv.verbose, noColor);
      printHelpTips(noColor);
    }

    if (argv.report) {
      const reportDir = path.resolve(argv.report);
      fs.mkdirSync(reportDir, { recursive: true });
      writeJsonReport(report, path.join(reportDir, 'report.json'));
      writeJUnitReport(report, path.join(reportDir, 'junit.xml'));
    }

    return determineExitCode(report);
  } catch (e) {
    const noColor = detectCiNoColor();
    const c = noColor ? (s: string) => s : (s: string) => s;
    const red = noColor ? (s: string) => s : chalk.red;
    const bold = noColor ? (s: string) => s : chalk.bold;
    const yellow = noColor ? (s: string) => s : chalk.yellow;

    if (e instanceof Error) {
      if (e.message.includes('Unknown argument') || e.message.includes('arguments:') || e.message.includes('参数必须')) {
        console.error(c(red(bold('参数错误'))));
        console.error(c(`  ${e.message}`));
        console.error(c(yellow('  使用 --help 查看所有可用选项')));
        return EXIT_CODES.CONFIG_ERROR;
      }
    }

    console.error(c(red(bold('运行时异常'))));
    console.error(c('─'.repeat(80)));
    if (e instanceof Error) {
      console.error(c(red(`类型: ${e.name}`)));
      console.error(c(`信息: ${e.message}`));
      if (e.stack && process.env.DEBUG) {
        console.error(c('\n堆栈:'));
        console.error(e.stack);
      }
    } else {
      console.error(c(`未知异常: ${String(e)}`));
    }
    console.error(c(yellow('\n建议: 检查配置是否正确，或使用 --dry-run 验证配置')));
    return EXIT_CODES.RUNTIME_ERROR;
  }
}

process.on('SIGINT', () => {
  process.exit(EXIT_CODES.INTERRUPTED);
});

process.on('SIGTERM', () => {
  process.exit(EXIT_CODES.INTERRUPTED);
});

main()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((e) => {
    console.error('致命错误:', e);
    process.exit(EXIT_CODES.RUNTIME_ERROR);
  });
