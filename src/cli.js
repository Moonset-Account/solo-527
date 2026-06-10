'use strict';

const { Command, Option } = require('commander');
const { scanCommand } = require('./commands/scan');
const { initCommand } = require('./commands/init');
const { configShowCommand, configPathsCommand } = require('./commands/config');
const { EXIT_CODES, DEFAULT_CONFIG } = require('./utils/constants');

function buildProgram() {
  const program = new Command();

  program
    .name('md-link-checker')
    .description(
`Markdown 文档链接检查器
  递归扫描 Markdown 文件，校验相对链接、标题锚点、图片引用和外部 URL。
  支持配置文件、忽略规则、多种输出格式，并可在 CI 中通过退出码判断结果。`
    )
    .version('1.0.0', '-V, --version', '显示版本号')
    .helpOption('-h, --help', '显示此帮助信息')
    .configureOutput({
      outputError: (str, write) => write(str.replace(/^error: /i, ''))
    })
    .showHelpAfterError(true)
    .showSuggestionAfterError(true);

  addGlobalOptions(program);

  program
    .command('scan', { isDefault: true })
    .description(
`扫描目录中的 Markdown 文件并检查所有链接
  示例:
    md-link-checker scan                                      # 扫描当前目录
    md-link-checker scan --root ./docs --format json          # JSON 输出
    md-link-checker scan --preview                            # 先预览再确认
    md-link-checker scan --ignore "*.pdf" --ignore-file legacy.md
    md-link-checker --timeout 10000 --concurrency 16 scan
    md-link-checker scan --check-external false               # 离线模式（不请求网络）
    md-link-checker scan --check-anchors false                # 跳过锚点检查`
    )
    .addOption(new Option('-r, --root <path>', '扫描根目录').default(undefined, 'process.cwd()'))
    .addOption(new Option('-t, --timeout <ms>', '外部链接超时时间 (毫秒)').argParser(parsePositiveInt).default(undefined, '5000'))
    .addOption(new Option('-f, --format <fmt>', '输出格式', ['text', 'json', 'markdown']).default(undefined, 'text'))
    .addOption(new Option('-o, --output <file>', '将报告写入文件'))
    .addOption(new Option('-c, --concurrency <n>', '并发检查数 (外链)').argParser(parsePositiveInt).default(undefined, '8'))
    .addOption(new Option('-i, --ignore <patterns>', '忽略链接 (逗号分隔或多次指定)').argParser((v, p = []) => [...p, ...v.split(',')]))
    .addOption(new Option('--ignore-pattern <regex>', '忽略链接的正则 (多次指定)').argParser(collectMulti))
    .addOption(new Option('--ignore-file <patterns>', '忽略文件 (逗号分隔)').argParser((v, p = []) => [...p, ...v.split(',')]))
    .addOption(new Option('--ext <exts>', '扫描的文件扩展名 (逗号分隔)').argParser((v, p = []) => [...p, ...v.split(',')]))
    .addOption(new Option('--check-anchors <bool>', '检查内部锚点 (#xxx): true/false (默认读配置文件，回退 true)').argParser(parseBoolArg))
    .addOption(new Option('--check-external <bool>', '检查外部 URL: true/false (默认读配置文件，回退 true)').argParser(parseBoolArg))
    .addOption(new Option('--check-images <bool>', '检查图片引用: true/false (默认读配置文件，回退 true)').argParser(parseBoolArg))
    .addOption(new Option('--recursive <bool>', '递归子目录: true/false (默认读配置文件，回退 true)').argParser(parseBoolArg))
    .addOption(new Option('--no-check-anchors', '不检查内部锚点（等同于 --check-anchors false）'))
    .addOption(new Option('--no-check-external', '不检查外部 URL（离线模式，等同于 --check-external false）'))
    .addOption(new Option('--no-check-images', '不检查图片引用（等同于 --check-images false）'))
    .addOption(new Option('--no-recursive', '不递归子目录（等同于 --recursive false）'))
    .addOption(new Option('-n, --dry-run', '只预览不实际执行'))
    .addOption(new Option('-p, --preview', '先显示扫描范围再确认执行'))
    .addOption(new Option('-y, --yes', '危险操作自动确认 (非交互环境使用)'))
    .addOption(new Option('-C, --config <file>', '指定配置文件路径'))
    .addOption(new Option('--log-level <level>', '日志级别', ['debug', 'info', 'warn', 'error', 'silent']).default(undefined, 'info'))
    .action((opts, cmd) => scanCommand(opts, cmd));

  program
    .command('init')
    .description(
`生成示例配置文件
  示例:
    md-link-checker init                  # 生成 .mdlinkcheckerrc.yaml
    md-link-checker init --format json    # 生成 JSON 格式
    md-link-checker init --format js      # 生成 JS 配置
    md-link-checker init --force          # 覆盖已存在的文件`
    )
    .addOption(new Option('-F, --format <type>', '配置文件格式', ['yaml', 'yml', 'json', 'js', 'javascript']).default('yaml'))
    .addOption(new Option('-o, --output <path>', '输出路径'))
    .addOption(new Option('--force', '覆盖已存在的文件'))
    .action(initCommand);

  const configCmd = program
    .command('config')
    .description('查看和管理配置');

  configCmd
    .command('show')
    .description(
`显示当前有效配置（合并默认值、配置文件和命令行参数）
  示例:
    md-link-checker config show
    md-link-checker config show --config ./custom.config.yaml
    md-link-checker config show --root ./docs --format json`
    )
    .addOption(new Option('-r, --root <path>', '用于查找配置文件的根目录'))
    .addOption(new Option('-C, --config <file>', '指定配置文件路径'))
    .addOption(new Option('-f, --format <fmt>', '输出格式', ['text', 'json']).default('text'))
    .addOption(new Option('--output-format <fmt>', '等同于 --format'))
    .addOption(new Option('-t, --timeout <ms>', '').argParser(parsePositiveInt))
    .addOption(new Option('--concurrency <n>', '').argParser(parsePositiveInt))
    .addOption(new Option('-i, --ignore <patterns>', '').argParser((v, p = []) => [...p, ...v.split(',')]))
    .addOption(new Option('--ignore-pattern <regex>', '').argParser(collectMulti))
    .addOption(new Option('--ignore-file <patterns>', '').argParser((v, p = []) => [...p, ...v.split(',')]))
    .addOption(new Option('--ext <exts>', '').argParser(collectMulti))
    .addOption(new Option('--check-anchors <bool>', '').argParser(parseBoolArg))
    .addOption(new Option('--check-external <bool>', '').argParser(parseBoolArg))
    .addOption(new Option('--check-images <bool>', '').argParser(parseBoolArg))
    .addOption(new Option('--recursive <bool>', '').argParser(parseBoolArg))
    .addOption(new Option('--no-check-anchors', ''))
    .addOption(new Option('--no-check-external', ''))
    .addOption(new Option('--no-check-images', ''))
    .addOption(new Option('--no-recursive', ''))
    .addOption(new Option('--log-level <level>', '', ['debug', 'info', 'warn', 'error', 'silent']))
    .addOption(new Option('-v, --verbose'))
    .addOption(new Option('-q, --quiet'))
    .action(configShowCommand);

  configCmd
    .command('paths')
    .description(
`显示配置文件搜索路径和当前生效的配置文件
  示例:
    md-link-checker config paths`
    )
    .action(configPathsCommand);

  program
    .command('help [command]')
    .description('显示指定命令的详细帮助')
    .action((cmdName) => {
      if (!cmdName) {
        program.outputHelp();
        return;
      }
      const cmd = program.commands.find(c => c.name() === cmdName
        || (c.aliases && c.aliases().includes(cmdName)));
      if (cmd) {
        cmd.outputHelp();
      } else {
        process.stderr.write(`未知命令: ${cmdName}\n\n`);
        program.outputHelp();
        process.exit(EXIT_CODES.INVALID_ARGUMENTS);
      }
    });

  program.on('command:*', (operands) => {
    process.stderr.write(`错误: 未知子命令 "${operands.join(' ')}"\n`);
    process.stderr.write('运行 md-link-checker --help 查看可用命令\n');
    process.exit(EXIT_CODES.INVALID_ARGUMENTS);
  });

  return program;
}

function addGlobalOptions(program) {
  program.option('-v, --verbose', '详细日志输出 (等同于 --log-level debug)');
  program.option('-q, --quiet', '静默模式，只输出错误');
}

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    throw new Error(`必须是正整数，收到: ${value}`);
  }
  return parsed;
}

function parseBoolArg(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  const v = String(value).toLowerCase().trim();
  if (['true', '1', 'yes', 'y', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'n', 'off'].includes(v)) return false;
  throw new Error(`布尔参数必须是 true/false/1/0，收到: ${value}`);
}

function collectMulti(value, previous = []) {
  return previous.concat([value]);
}

async function run(argv) {
  const program = buildProgram();
  try {
    await program.parseAsync(argv);
  } catch (err) {
    if (err.exitCode !== undefined && err.exitCode !== null) {
      process.exit(err.exitCode);
    }
    if (err.code === 'commander.InvalidArgument') {
      process.stderr.write(`参数错误: ${err.message}\n`);
      process.exit(EXIT_CODES.INVALID_ARGUMENTS);
    }
    if (err.code === 'commander.CommanderError' && err.exitCode !== undefined) {
      process.exit(err.exitCode);
    }
    process.stderr.write(`运行时错误: ${err.message}\n`);
    if (process.env.DEBUG) process.stderr.write(err.stack + '\n');
    process.exit(EXIT_CODES.SCAN_ERROR);
  }
}

module.exports = {
  run,
  buildProgram
};
