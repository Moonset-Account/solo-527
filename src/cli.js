#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const chalk = require('chalk');

const { ConfigMerger, ARRAY_STRATEGIES, MERGE_STRATEGIES } = require('./index');
const { parseFile, serialize, ConfigParseError } = require('./parser');
const completion = require('./completion');
const formatter = require('./formatter');

const EXAMPLES = [
  {
    title: '1. 基础合并 - 将开发环境配置覆盖到基础配置',
    cmd: 'config-merger --base config/base.yaml --overlay config/dev.yaml --output config/merged.yaml'
  },
  {
    title: '2. 多层覆盖 - 基础 -> 环境 -> 实例 三层合并',
    cmd: 'config-merger -b base.json -o env/prod.json -o instances/server-a.json -O final.json'
  },
  {
    title: '3. 数组合并策略 - 使用 concat 策略追加数组元素',
    cmd: 'config-merger -b base.yaml -o overlay.yaml --array-strategy concat --preview'
  },
  {
    title: '4. 试运行模式 - 查看合并结果但不写入文件',
    cmd: 'config-merger -b config.json -o override.json --dry-run --verbose'
  },
  {
    title: '5. Schema 校验 - 合并后验证配置是否符合规范',
    cmd: 'config-merger -b base.yaml -o prod.yaml --schema schemas/app-schema.json'
  },
  {
    title: '6. 机器可读输出 - 供 CI/CD 脚本解析',
    cmd: 'config-merger -b base.json -o prod.json --machine-readable --print json'
  },
  {
    title: '7. 敏感键处理 - 自动脱敏并指定额外敏感键',
    cmd: 'config-merger -b config.yaml -o secrets.yaml --sensitive-keys db_password,api_token --mask-type partial'
  },
  {
    title: '8. 浅合并 - 只合并顶层键 (危险: 子对象将被完全替换)',
    cmd: 'config-merger -b base.yaml -o overlay.yaml --strategy shallow'
  },
  {
    title: '9. 使用配置文件 - 所有参数写在配置文件中',
    cmd: 'config-merger --config merger-config.json'
  },
  {
    title: '10. 配置文件与命令行参数混合使用 (命令行优先级更高)',
    cmd: 'config-merger --config merger-config.json --output override-output.yaml --verbose'
  }
];

const CONFIG_FILE_SCHEMA_DESCRIPTION = `
配置文件格式 (JSON/YAML):
{
  "base": "config/base.yaml",
  "overlays": ["config/dev.yaml", "config/local.yaml"],
  "strategy": "deep",
  "arrayStrategy": "replace",
  "schema": "schemas/config.json",
  "output": "config/merged.yaml",
  "print": "yaml",
  "dryRun": false,
  "preview": true,
  "verbose": true,
  "quiet": false,
  "machineReadable": false,
  "noColor": false,
  "maskSensitive": true,
  "sensitiveKeys": ["db_password", "custom_secret"],
  "maskType": "default",
  "detectConflicts": true
}
`;

function createProgram() {
  const program = new Command();

  program
    .name('config-merger')
    .description(`
JSON/YAML 配置合并器
====================
用于处理多环境配置文件的合并，支持:
  • 多层覆盖 (base + overlays)
  • 多种合并策略 (deep/shallow/overlay)
  • 灵活的数组合并规则
  • 敏感键自动检测与脱敏
  • Schema 校验 (JSON Schema)
  • 冲突检测与提示
  • Dry-run 预览模式
  • 机器可读输出 (CI/CD 友好)

合并顺序: base -> overlay1 -> overlay2 -> ... (后加载的优先级更高)
默认策略: 深度合并 + 数组替换 (保守、安全的默认行为)
`.trim())
    .version(require('../package.json').version, '-V, --version', '显示版本号')
    .helpOption('-h, --help', '显示帮助信息');

  program
    .option('-b, --base <file>', '基础配置文件 (JSON/YAML) - 优先级最低')
    .option('-o, --overlay <files...>', '覆盖配置文件，可多次指定，后指定的优先级更高', [])
    .option('-s, --strategy <type>', `合并策略: ${Object.values(MERGE_STRATEGIES).join(' | ')} (默认: deep)`, MERGE_STRATEGIES.DEEP)
    .option('-a, --array-strategy <type>', `数组合并策略: ${Object.values(ARRAY_STRATEGIES).join(' | ')} (默认: replace)`, ARRAY_STRATEGIES.REPLACE)
    .option('--schema <file>', 'Schema 校验文件 (JSON Schema)')
    .option('-O, --output <file>', '输出文件路径 (如不指定则仅打印摘要)')
    .option('-p, --print [format]', '打印合并结果到控制台，可选格式: json | yaml | yml (默认: json)')
    .option('--dry-run', '试运行模式，解析和合并但不写入文件，自动启用 --preview')
    .option('--preview', '预览合并结果，显示差异标记 (+新增 ~修改 -删除)')
    .option('-v, --verbose', '详细模式，显示完整的变更列表、冲突详情和校验错误')
    .option('-q, --quiet', '安静模式，仅显示严重错误和最终退出码')
    .option('--machine-readable', '机器可读输出，摘要以 JSON 格式输出 (适用于 CI/CD)')
    .option('--no-color', '禁用彩色输出 (自动检测非 TTY 环境)')
    .option('--sensitive-keys <keys>', '指定额外的敏感键名，逗号分隔 (例: db_pass,api_token)', '')
    .option('--no-sensitive', '禁用敏感键自动检测和脱敏')
    .option('--mask-type <type>', '脱敏类型: default | full | partial | hash | remove (默认: default)', 'default')
    .option('--detect-conflicts', '启用冲突检测 (默认启用)', true)
    .option('--no-conflicts', '禁用冲突检测')
    .option('-c, --config <file>', '参数配置文件 (JSON/YAML)，文件中的参数会被命令行参数覆盖')
    .option('--examples', '显示使用示例')
    .option('--completion [shell]', '生成 Shell 补全脚本: bash | zsh | fish');

  program.on('--help', () => {
    console.log('');
    console.log(chalk.bold('策略说明:'));
    console.log(chalk.cyan('  合并策略 (--strategy):'));
    console.log('    deep       - 深度递归合并 (默认，推荐)');
    console.log('    shallow    - 浅合并，仅顶层键，子对象将被完全替换');
    console.log('    overlay    - 完全覆盖，overlay 直接替换 base');
    console.log('');
    console.log(chalk.cyan('  数组合并 (--array-strategy):'));
    console.log('    replace    - overlay 数组完全替换 base (默认，保守)');
    console.log('    concat     - 拼接: base + overlay');
    console.log('    prepend    - 前置: overlay + base');
    console.log('    unique     - 去重拼接');
    console.log('    merge      - 按索引位置合并 (对象数组推荐)');
    console.log('');
    console.log(chalk.bold('覆盖优先级 (从低到高):'));
    console.log('  配置文件 < --base < --overlay(按顺序) < 命令行参数');
    console.log('');
    console.log(chalk.bold('退出码:'));
    console.log('  0 - 成功');
    console.log('  1 - 有错误 (解析失败/Schema校验失败)');
    console.log('  2 - 参数错误');
    console.log('');
    console.log(chalk.gray(`支持的文件格式: .json, .yaml, .yml`));
    console.log('');
  });

  return program;
}

function parseConfigFile(configPath) {
  try {
    const result = parseFile(configPath);
    const cfg = result.data || {};

    return {
      base: cfg.base || undefined,
      overlay: cfg.overlays || cfg.overlay || undefined,
      strategy: cfg.strategy || undefined,
      arrayStrategy: cfg.arrayStrategy || cfg.array_strategy || undefined,
      schema: cfg.schema || undefined,
      output: cfg.output || undefined,
      print: cfg.print || undefined,
      dryRun: cfg.dryRun || cfg.dry_run || undefined,
      preview: cfg.preview || undefined,
      verbose: cfg.verbose || undefined,
      quiet: cfg.quiet || undefined,
      machineReadable: cfg.machineReadable || cfg.machine_readable || undefined,
      noColor: cfg.noColor || cfg.no_color || undefined,
      sensitive: cfg.maskSensitive !== undefined ? cfg.maskSensitive : (cfg.sensitive !== undefined ? cfg.sensitive : undefined),
      sensitiveKeys: cfg.sensitiveKeys || cfg.sensitive_keys || undefined,
      maskType: cfg.maskType || cfg.mask_type || undefined,
      conflicts: cfg.detectConflicts !== undefined ? cfg.detectConflicts : (cfg.conflicts !== undefined ? cfg.conflicts : undefined),
      _configSource: configPath
    };
  } catch (err) {
    console.error(formatter.formatError(err, { useColor: !process.env.NO_COLOR }));
    process.exit(2);
  }
}

function validateOptions(opts) {
  const errors = [];

  if (!opts.base) {
    errors.push('必须指定 --base 基础配置文件');
  }

  if (!Object.values(MERGE_STRATEGIES).includes(opts.strategy)) {
    errors.push(`无效的合并策略: ${opts.strategy}。可选: ${Object.values(MERGE_STRATEGIES).join(', ')}`);
  }

  if (!Object.values(ARRAY_STRATEGIES).includes(opts.arrayStrategy)) {
    errors.push(`无效的数组合并策略: ${opts.arrayStrategy}。可选: ${Object.values(ARRAY_STRATEGIES).join(', ')}`);
  }

  const validPrintFormats = ['json', 'yaml', 'yml'];
  if (opts.print !== undefined && opts.print !== true && !validPrintFormats.includes(String(opts.print).toLowerCase())) {
    errors.push(`无效的打印格式: ${opts.print}。可选: ${validPrintFormats.join(', ')}`);
  }

  const validMaskTypes = ['default', 'full', 'partial', 'hash', 'remove'];
  if (!validMaskTypes.includes(opts.maskType)) {
    errors.push(`无效的脱敏类型: ${opts.maskType}。可选: ${validMaskTypes.join(', ')}`);
  }

  return errors;
}

function processSensitiveKeys(keysInput) {
  if (!keysInput) return [];
  if (Array.isArray(keysInput)) {
    return keysInput.map(k => String(k).trim()).filter(Boolean);
  }
  return String(keysInput).split(',').map(k => k.trim()).filter(Boolean);
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function printExamples() {
  console.log('');
  console.log(chalk.bold('📋 使用示例'));
  console.log('');
  for (const ex of EXAMPLES) {
    console.log(chalk.cyan(`  ${ex.title}`));
    console.log('');
    console.log(chalk.gray('    $ ') + chalk.white(ex.cmd));
    console.log('');
  }
  console.log(chalk.bold('📄 配置文件格式:'));
  console.log(CONFIG_FILE_SCHEMA_DESCRIPTION);
}

async function main() {
  const program = createProgram();

  try {
    program.parse(process.argv);
  } catch (err) {
    console.error(formatter.formatError({ message: err.message, name: 'ArgumentError' }, { useColor: !process.env.NO_COLOR }));
    process.exit(2);
  }

  const opts = program.opts();

  if (opts.color === false || process.env.NO_COLOR) {
    process.env.FORCE_COLOR = '0';
    chalk.level = 0;
  }

  if (opts.examples) {
    printExamples();
    process.exit(0);
  }

  if (opts.completion !== undefined) {
    try {
      const shell = opts.completion === true ? completion.detectShell() : opts.completion;
      console.log(completion.getCompletion(shell));
    } catch (err) {
      console.error(chalk.red(err.message));
      console.log(chalk.gray(completion.printSetupInstructions()));
      process.exit(2);
    }
    process.exit(0);
  }

  let fileOptions = {};
  if (opts.config) {
    fileOptions = parseConfigFile(opts.config);
  }

  const mergedOpts = {
    base: opts.base || fileOptions.base,
    overlay: (opts.overlay && opts.overlay.length > 0) ? opts.overlay : fileOptions.overlay,
    strategy: opts.strategy !== MERGE_STRATEGIES.DEEP || !fileOptions.strategy
      ? opts.strategy : fileOptions.strategy,
    arrayStrategy: opts.arrayStrategy !== ARRAY_STRATEGIES.REPLACE || !fileOptions.arrayStrategy
      ? opts.arrayStrategy : fileOptions.arrayStrategy,
    schema: opts.schema || fileOptions.schema,
    output: opts.output || fileOptions.output,
    print: opts.print !== undefined ? opts.print : fileOptions.print,
    dryRun: opts.dryRun !== undefined ? opts.dryRun : fileOptions.dryRun,
    preview: opts.preview !== undefined ? opts.preview : fileOptions.preview,
    verbose: opts.verbose !== undefined ? opts.verbose : fileOptions.verbose,
    quiet: opts.quiet !== undefined ? opts.quiet : fileOptions.quiet,
    machineReadable: opts.machineReadable !== undefined ? opts.machineReadable : fileOptions.machineReadable,
    noColor: opts.noColor !== undefined ? opts.noColor : fileOptions.noColor,
    sensitive: opts.sensitive !== undefined ? opts.sensitive : fileOptions.sensitive,
    sensitiveKeys: opts.sensitiveKeys !== '' ? opts.sensitiveKeys : fileOptions.sensitiveKeys,
    maskType: opts.maskType !== 'default' || !fileOptions.maskType
      ? opts.maskType : fileOptions.maskType,
    conflicts: opts.conflicts !== undefined ? opts.conflicts : fileOptions.conflicts
  };

  if (mergedOpts.dryRun && !mergedOpts.preview) {
    mergedOpts.preview = true;
  }
  if (mergedOpts.verbose && mergedOpts.quiet) {
    mergedOpts.quiet = false;
  }

  const optionErrors = validateOptions(mergedOpts);
  if (optionErrors.length > 0) {
    console.error(chalk.red.bold('\n参数错误:'));
    for (const err of optionErrors) {
      console.error(chalk.red(`  ✗ ${err}`));
    }
    console.error(chalk.gray('\n使用 --help 查看帮助信息'));
    process.exit(2);
  }

  const inputFiles = [
    mergedOpts.base,
    ...(Array.isArray(mergedOpts.overlay) ? mergedOpts.overlay : [])
  ].filter(Boolean);

  const merger = new ConfigMerger({
    mergeStrategy: mergedOpts.strategy,
    arrayStrategy: mergedOpts.arrayStrategy,
    detectConflicts: mergedOpts.conflicts,
    maskSensitive: mergedOpts.sensitive,
    sensitiveKeys: processSensitiveKeys(mergedOpts.sensitiveKeys || ''),
    maskType: mergedOpts.maskType
  });

  let result;
  try {
    result = merger.run(inputFiles, {
      schemaFile: mergedOpts.schema,
      outputFile: mergedOpts.output,
      outputFormat: mergedOpts.print === true ? 'json' : (typeof mergedOpts.print === 'string' ? mergedOpts.print : null),
      pretty: true,
      dryRun: mergedOpts.dryRun,
      preview: mergedOpts.preview
    });
  } catch (err) {
    console.error(formatter.formatError(err, { useColor: opts.color !== false, showStack: mergedOpts.verbose }));
    process.exit(1);
  }

  if (mergedOpts.preview && !mergedOpts.quiet) {
    console.log(formatter.formatPreview(result.mergeResult, {
      useColor: opts.color !== false,
      showDiff: true
    }));
  }

  if (mergedOpts.print && result.output && !mergedOpts.quiet) {
    console.log(result.output);
  }

  if (mergedOpts.output && !mergedOpts.dryRun) {
    try {
      const resolvedOutput = path.resolve(process.cwd(), mergedOpts.output);
      ensureDir(resolvedOutput);
      fs.writeFileSync(resolvedOutput, result.output, 'utf8');
      result.summary.outputFile = resolvedOutput;
    } catch (err) {
      console.error(formatter.formatError({
        name: 'WriteError',
        message: `写入文件失败: ${err.message}`,
        filePath: mergedOpts.output
      }, { useColor: opts.color !== false }));
      process.exit(1);
    }
  }

  if (mergedOpts.output && mergedOpts.dryRun && !mergedOpts.quiet) {
    console.log(chalk.yellow(`[dry-run] 将写入: ${path.resolve(process.cwd(), mergedOpts.output)}`));
  }

  if (!mergedOpts.quiet) {
    console.log(formatter.formatSummary(result.summary, {
      useColor: opts.color !== false,
      detailed: mergedOpts.verbose,
      machineReadable: mergedOpts.machineReadable
    }));
  } else if (mergedOpts.machineReadable) {
    console.log(JSON.stringify(result.summary, null, 2));
  }

  if (result.schemaResult && !result.schemaResult.valid && mergedOpts.verbose && !mergedOpts.machineReadable) {
    console.log(result.schemaResult.formatErrors(true));
  }

  process.exit(result.summary.exitCode);
}

main().catch(err => {
  console.error(formatter.formatError(err, { useColor: !process.env.NO_COLOR, showStack: true }));
  process.exit(1);
});
