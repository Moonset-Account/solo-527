#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import { CLIOptions, LogLevel } from './types';
import { ConfigLoader } from './core/loader';
import { TestCaseBuilder } from './core/builder';
import { TestRunner } from './core/runner';
import { ReportGenerator } from './core/reporter';
import { logger } from './utils/logger';
import { PathUtils } from './utils/path';
import { AppError } from './utils/errors';
import { CompletionGenerator } from './utils/completion';

const PKG_PATH = PathUtils.join(__dirname, '..', 'package.json');
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));

const VERSION = pkg.version;
const NAME = pkg.name;

function parseKeyValuePairs(values: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const v of values || []) {
    const eqIdx = v.indexOf('=');
    if (eqIdx > 0) {
      const key = v.substring(0, eqIdx).trim();
      const value = v.substring(eqIdx + 1).trim();
      result[key] = value;
    } else {
      throw new AppError(`无效的键值对格式: ${v}。请使用 key=value 格式`, {
        code: 'INVALID_KEY_VALUE',
        suggestions: ['正确格式: --global MY_TOKEN=abc123', '或使用: --g ENV=prod'],
      });
    }
  }
  return result;
}

function buildExamples(): string {
  return `

示例命令:

  # 1. 基本用法 - 运行集合中所有用例
  $ api-smoke --collection ./tests/collection.json

  # 2. 指定环境文件
  $ api-smoke -c ./tests/collection.yaml -e ./envs/prod.yaml

  # 3. 并发执行 5 个用例 + 导出 JUnit 报告
  $ api-smoke -c collection.json --parallel 5 --junit ./reports/result.xml

  # 4. Dry Run 模式 - 只显示将要执行的内容，不发送请求
  $ api-smoke -c collection.json --dry-run

  # 5. 按名称过滤测试用例
  $ api-smoke -c collection.json --filter "登录"

  # 6. 按标签包含/排除
  $ api-smoke -c collection.json --tags smoke,regression --exclude-tags slow

  # 7. 调试模式 - 显示详细日志
  $ api-smoke -c collection.json --log-level debug

  # 8. 静默模式 + 失败立即停止
  $ api-smoke -c collection.json --silent --bail

  # 9. 通过命令行覆盖环境变量
  $ api-smoke -c collection.json --global BASE_URL=http://localhost:8080 --global TOKEN=xxx

  # 10. 关闭 SSL 验证（测试用）
  $ api-smoke -c collection.json --insecure

  # 11. 生成 shell completion
  $ api-smoke completion bash > /etc/bash_completion.d/api-smoke
  $ api-smoke completion zsh > ~/.zsh/completion/_api-smoke

  # 12. 自定义 timeout 和重试
  $ api-smoke -c collection.json --timeout 60000 --retries 3 --retry-delay 2000

配置文件与命令行覆盖优先级（从低到高）:
  collection.variables → environment.variables → --global KEY=VALUE
  collection.auth → environment.auth → request.auth
  collection.settings.timeout → --timeout
  collection.settings.retries → --retries
  collection.headers → environment.headers → request.headers
`;
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const program = new Command();

  program.exitOverride();

  program
    .name('api-smoke')
    .description(`
┌────────────────────────────────────────────────────────────┐
│          API 冒烟测试命令行工具 (${NAME})                │
│          版本: ${VERSION}                                        │
│          支持集合管理、鉴权、并发执行、断言报告            │
└────────────────────────────────────────────────────────────┘

用法示例:
  $ api-smoke --collection tests/collection.json
  $ api-smoke -c collection.yaml -e envs/prod.yaml --parallel 4 --junit report.xml
  $ api-smoke -c collection.json --dry-run --log-level debug
  $ api-smoke completion bash >> ~/.bashrc
`)
    .version(VERSION, '-v, --version', '显示版本号')
    .helpOption('-h, --help', '显示帮助信息')
    .addHelpText('after', buildExamples())
    .option('-c, --collection <path>', '测试集合文件路径（支持 .json/.yaml/.yml）')
    .option('-e, --env <path>', '环境变量配置文件路径')
    .option('-p, --parallel <number>', '并发执行数量，默认 1（串行）', parseNumber, 1)
    .option('-j, --junit <path>', '导出 JUnit XML 报告到指定文件')
    .option('--json <path>', '导出 JSON 格式报告到指定文件')
    .option('-o, --output <path>', '统一输出目录，报告将自动命名')
    .option('-l, --log-level <level>', '日志级别: silent|error|warn|info|debug|verbose', 'info')
    .option('--verbose', '等价于 --log-level verbose', false)
    .option('--silent', '等价于 --log-level silent', false)
    .option('--no-color', '禁用彩色输出')
    .option('-n, --dry-run', '预演模式，只显示将要执行的内容不发送请求', false)
    .option('-b, --bail', '遇到第一个失败时立即停止', false)
    .option('-t, --timeout <ms>', '每个请求的超时时间（毫秒）', parseNumber)
    .option('-r, --retries <count>', '失败重试次数', parseNumber)
    .option('--retry-delay <ms>', '重试间隔（毫秒）', parseNumber, 1000)
    .option('-f, --filter <keyword>', '按用例名称关键词过滤')
    .option('--tags <tags>', '只运行包含指定标签的用例（逗号分隔）', parseList)
    .option('--exclude-tags <tags>', '排除包含指定标签的用例（逗号分隔）', parseList)
    .option('-g, --global <pairs...>', '设置全局变量（格式: KEY=VALUE，可多次使用）')
    .option('--strict-variables', '严格模式：未定义变量报错而非空值', false)
    .option('--fail-on-zero-tests', '没有测试用例时返回非零退出码', false)
    .option('-k, --insecure', '关闭 SSL 证书验证（仅测试用）', false)
    .option('--no-follow-redirects', '不跟随 HTTP 重定向')
    .action(async () => {
      const opts = program.opts<CLIOptions>();
      const exitCode = await runSmokeTests(opts);
      process.exitCode = exitCode;
    });

  program
    .command('completion')
    .description('生成 shell 补全脚本（支持 bash/zsh）')
    .argument('[shell]', 'shell 类型: bash | zsh', 'bash')
    .option('--write', '自动写入到 shell 配置文件')
    .action((shell: string, opts: { write?: boolean }) => {
      try {
        const script = CompletionGenerator.generate(shell as 'bash' | 'zsh');
        if (opts.write) {
          const path = CompletionGenerator.install(shell as 'bash' | 'zsh');
          console.log(`✅ Completion 已安装到: ${path}`);
        } else {
          process.stdout.write(script);
        }
      } catch (err) {
        console.error(`生成 completion 失败: ${(err as Error).message}`);
        process.exit(1);
      }
    });

  try {
    await program.parseAsync(argv, { from: 'user' });
    return Number(process.exitCode) || 0;
  } catch (err) {
    if ((err as Error).name === 'CommanderError') {
      const code = (err as { exitCode?: number }).exitCode;
      if (code === 0 || code === undefined) {
        return 0;
      }
      return code || 2;
    }
    if (err instanceof AppError) {
      console.error(err.toUserMessage());
    } else {
      console.error(`❌ 参数解析错误: ${(err as Error).message}`);
    }
    return 2;
  }
}

async function runSmokeTests(opts: CLIOptions): Promise<number> {
  if (!opts.collection) {
    console.error('❌ 错误: 缺少必填参数 -c, --collection <path>');
    console.error('   使用 api-smoke --help 查看帮助');
    return 2;
  }

  configureLogger(opts);

  logger.verbose(`API Smoke Tester v${VERSION}`);
  logger.verbose(`工作目录: ${process.cwd()}`);
  logger.verbose(`Node.js: ${process.version}`);

  try {
    const absCollectionPath = PathUtils.makeAbsolute(opts.collection);
    logger.debug(`集合文件: ${absCollectionPath}`);

    const collection = ConfigLoader.loadCollection(absCollectionPath, {
      strictVariables: opts.strictVariables,
      globals: opts.globals ? parseKeyValuePairs(opts.globals as unknown as string[]) : {},
    });
    logger.info(`✅ 加载集合: ${collection.name} (${collection.requests?.length || 0} 顶级请求)`);

    let environment = undefined;
    if (opts.env) {
      const absEnvPath = PathUtils.makeAbsolute(opts.env);
      logger.debug(`环境文件: ${absEnvPath}`);
      environment = ConfigLoader.loadEnvironment(absEnvPath);
      logger.info(`✅ 加载环境: ${environment.name}`);
    }

    if (opts.globals && (opts.globals as unknown as string[]).length > 0) {
      const kvPairs = parseKeyValuePairs(opts.globals as unknown as string[]);
      logger.info(`✅ 命令行全局变量: ${Object.keys(kvPairs).length} 个`);
      if (!opts.globals) opts.globals = {} as Record<string, string>;
      Object.assign(opts.globals as Record<string, string>, kvPairs);
    }

    const testCases = TestCaseBuilder.buildTestCases(collection, environment, {
      collectionPath: absCollectionPath,
      strictVariables: opts.strictVariables,
      cliOptions: opts,
    });

    if (testCases.length === 0 && opts.failOnZeroTests) {
      logger.error('❌ 没有匹配的测试用例，因 --fail-on-zero-tests 退出');
      return 4;
    }

    if (testCases.length === 0) {
      logger.warn('⚠️  没有匹配的测试用例');
      return 0;
    }

    const runner = new TestRunner({
      parallel: opts.parallel,
      bail: opts.bail,
      dryRun: opts.dryRun,
      insecure: opts.insecure,
      followRedirects: opts.followRedirects,
    });

    const report = await runner.run(testCases, collection, environment, opts);

    ReportGenerator.printConsoleReport(report);

    if (opts.output) {
      const outputDir = PathUtils.makeAbsolute(opts.output);
      PathUtils.ensureDir(outputDir);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      ReportGenerator.writeJUnitFile(report, PathUtils.join(outputDir, `api-smoke-${timestamp}.xml`));
      ReportGenerator.writeJSONFile(report, PathUtils.join(outputDir, `api-smoke-${timestamp}.json`));
    }

    if (opts.junit) {
      ReportGenerator.writeJUnitFile(report, opts.junit);
    }

    if ((opts as unknown as Record<string, string>).json) {
      ReportGenerator.writeJSONFile(report, (opts as unknown as Record<string, string>).json);
    }

    if (report.summary.failed > 0) {
      return 1;
    }

    return 0;

  } catch (err) {
    if (err instanceof AppError) {
      logger.error(err.toUserMessage());
      return 3;
    }

    logger.error('❌ 运行时发生未处理的异常:');
    logger.error(`   ${(err as Error).message}`);
    if ((err as Error).stack) {
      logger.debug('调用栈:\n' + (err as Error).stack);
    }
    return 99;
  }
}

function parseNumber(value: string): number {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 0) {
    throw new AppError(`无效的数值: ${value}`, {
      code: 'INVALID_NUMBER',
      suggestions: ['请使用非负整数'],
    });
  }
  return n;
}

function parseList(value: string): string[] {
  return value.split(',').map(s => s.trim()).filter(Boolean);
}

function configureLogger(opts: CLIOptions): void {
  let level: LogLevel['level'] = (opts.logLevel as LogLevel['level']) || 'info';
  if (opts.verbose) level = 'verbose';
  if (opts.silent) level = 'silent';
  logger.setLevel(level);
  if (opts.noColor) {
    logger.setNoColor(true);
  }
}

if (require.main === module) {
  main()
    .then(exitCode => {
      process.exitCode = exitCode;
    })
    .catch(err => {
      console.error('致命错误:', err);
      process.exit(99);
    });
}
