#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { runCheck, getVersion } from './index';
import type { CliArgs } from './types';

const HELP_EPILOG = `
${pc.bold('示例:')}

  ${pc.green('# 使用默认配置运行，查找当前目录下的 locales/')}
  i18n-diff

  ${pc.green('# 指定基准语言和目标语言')}
  i18n-diff --base en --locale zh-CN --locale ja

  ${pc.green('# 只检查缺失键和占位符（保守模式）')}
  i18n-diff --missing --placeholder --no-extra

  ${pc.green('# 启用全部检查项')}
  i18n-diff --all

  ${pc.green('# 输出机器可读的 JSON 报告')}
  i18n-diff --json --output reports/diff.json

  ${pc.green('# 导出待翻译的 CSV，发送给翻译供应商')}
  i18n-diff --csv --output translations/to-translate.csv

  ${pc.green('# 命令行覆盖配置文件：仅对 ja 启用长度检查，放宽失败阈值')}
  i18n-diff --config ./i18n-diff.config.json \\
    --base en --locale ja \\
    --length --fail-on warning

  ${pc.green('# 高并发、多重试处理大型项目')}
  i18n-diff --locale-dir ./src/assets/i18n --concurrency 8 --retries 5

${pc.bold('默认行为（保守）:')}
  · 默认只检查 缺失键 / 多余键 / 占位符，长度与状态检查需显式启用
  · fail-on 默认 = error，仅在出现严重错误时返回非零退出码
  · 基准语言默认 = en，目标语言默认从配置或 --locale 获取
  · 并发默认 = 4，重试默认 = 3 次（指数退避）

${pc.bold('配置文件搜索顺序:')}
  1. --config 参数指定的路径
  2. i18n-diff.config.json / .js / .ts
  3. .i18n-diffrc / .i18n-diffrc.json / .i18n-diffrc.js
  4. package.json 中的 i18nDiff 字段

${pc.bold('退出码:')}
  0  无满足 fail-on 级别的问题
  1  存在达到阈值的问题
  2  参数 / 配置 / 语言包加载错误
`;

async function main() {
  const program = new Command();

  program
    .name('i18n-diff')
    .description('多语言文案差异检查器 - 检查 JSON 语言包的键对齐、占位符、长度与审核状态')
    .version(getVersion(), '-v, --version', '输出版本号')
    .helpOption('-h, --help', '显示帮助信息');

  program
    .option('-b, --base <locale>', '基准语言代码 (默认: en)')
    .option('-l, --locale <locale...>', '目标语言代码，可重复指定')
    .option('-d, --locale-dir <dir>', '语言包目录 (默认: ./locales)')
    .option('-p, --pattern <pattern>', '文件命名模式，使用 {locale} 占位 (默认: {locale}.json)')
    .option('-c, --config <path>', '指定配置文件路径')
    .option('-o, --output <file>', '报告输出文件路径 (默认: stdout)')

    .option('--missing', '启用缺失键检查')
    .option('--no-missing', '禁用缺失键检查')
    .option('--extra', '启用多余键检查')
    .option('--no-extra', '禁用多余键检查')
    .option('--placeholder', '启用占位符一致性检查')
    .option('--no-placeholder', '禁用占位符一致性检查')
    .option('--length', '启用翻译长度比例检查')
    .option('--no-length', '禁用翻译长度比例检查')
    .option('--status', '启用审核状态检查 (approved/draft/deprecated)')
    .option('--no-status', '禁用审核状态检查')
    .option('--value-diff', '启用值差异对比')
    .option('--no-value-diff', '禁用值差异对比')
    .option('--all', '启用全部检查项')

    .option('--json', '输出 JSON 格式（机器可读）')
    .option('--csv', '输出 CSV 格式（待翻译导出）')
    .option('--md, --markdown', '输出 Markdown 格式')

    .option('--fail-on <level>', '在此级别及以上问题时退出码非零: error|warning|info|never', 'error')
    .option('--concurrency <n>', '并发加载语言包数 (1-32，默认: 4)')
    .option('--retries <n>', '文件读取失败重试次数 (0-10，默认: 3)')
    .option('--placeholder-pattern <regex>', '占位符正则 (默认: \\{(\\w+)\\})')

    .option('-q, --quiet', '安静模式，减少日志输出')
    .option('--verbose', '详细模式，输出额外调试信息')

    .addHelpText('after', HELP_EPILOG);

  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error(pc.red('✖ 参数解析错误: ') + (err as Error).message);
    process.exit(2);
  }

  interface ProgramOpts extends CliArgs {
    pattern?: string;
    placeholderPattern?: string;
  }
  const opts = program.opts<ProgramOpts>();

  const args: CliArgs = {
    ...opts,
  };

  try {
    const result = await runCheck(args);

    if (!opts.quiet && result.outputFile) {
      console.error(pc.green(`✔ 报告已写入: ${result.outputFile}`));
    }

    if (!result.outputFile || opts.verbose) {
      process.stdout.write(result.rendered);
    }

    process.exit(result.exitCode);
  } catch (err) {
    const error = err as Error;
    const message = error.message;
    console.error('');
    console.error(pc.red(pc.bold('✖ 运行失败')));
    console.error(pc.red(`  ${message}`));
    if (args.verbose && error.stack) {
      console.error('');
      console.error(pc.gray(error.stack));
    }
    console.error('');
    console.error(pc.gray('使用 i18n-diff --help 查看完整帮助'));
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(pc.red(`未捕获错误: ${(err as Error).message}`));
  process.exit(2);
});
