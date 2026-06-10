'use strict';

const path = require('path');
const chalk = require('chalk');
const { EXIT_CODES, DEFAULT_CONFIG, CONFIG_FILE_NAMES } = require('../utils/constants');
const { buildConfig, describeConfigSources, findConfigFile, loadConfigFromFile } = require('../core/config');
const { createStructuredLogger } = require('../utils/logger');

async function configShowCommand(cmd) {
  const cliOptions = {
    root: cmd.root,
    timeout: cmd.timeout,
    format: cmd.format,
    ignore: cmd.ignore,
    ignorePatterns: cmd.ignorePattern,
    ignoreFiles: cmd.ignoreFile,
    concurrency: cmd.concurrency,
    checkAnchors: cmd.checkAnchors,
    checkExternal: cmd.checkExternal,
    checkImages: cmd.checkImages,
    verbose: cmd.verbose,
    quiet: cmd.quiet,
    recursive: cmd.recursive,
    fileExtensions: cmd.ext,
    configFile: cmd.config,
    logLevel: cmd.logLevel
  };

  const logger = createStructuredLogger({
    level: 'warn',
    quiet: cliOptions.quiet
  });

  let effective;
  try {
    effective = buildConfig({ cliOptions, logger });
  } catch (err) {
    process.stderr.write(chalk.red('✗ ' + err.message) + '\n');
    process.exit(err.exitCode || EXIT_CODES.CONFIG_ERROR);
  }

  const rootDir = effective.root;
  const discoveredFile = findConfigFile(rootDir, cliOptions.configFile);
  const fileConfig = discoveredFile ? loadConfigFromFile(discoveredFile) : null;

  const outFormat = (cmd.outputFormat || effective.format || 'text').toLowerCase();

  if (outFormat === 'json') {
    const display = buildDisplayConfig(effective);
    display._meta = {
      sources: {
        defaults: true,
        file: discoveredFile || null,
        cli: Object.keys(cleanCLI(cliOptions)).length > 0
      },
      priorityOrder: ['defaults', 'configFile', 'cliArguments'],
      configFileCandidates: CONFIG_FILE_NAMES,
      resolvedConfigFile: discoveredFile
    };
    if (fileConfig) display._meta.fileConfig = fileConfig;
    process.stdout.write(JSON.stringify(display, null, 2) + '\n');
    return;
  }

  const bar = '─'.repeat(70);
  process.stdout.write('\n');
  process.stdout.write(chalk.bold('  md-link-checker 有效配置展示\n'));
  process.stdout.write(chalk.gray(bar) + '\n\n');

  process.stdout.write(chalk.cyan('📋 配置来源及优先级 (从低到高):\n'));
  process.stdout.write(`  ${describeConfigSources(effective)}\n\n`);

  if (discoveredFile) {
    process.stdout.write(chalk.green('✓ 找到配置文件:\n'));
    process.stdout.write(`  ${discoveredFile}\n\n`);
  } else {
    process.stdout.write(chalk.yellow('⚠  未找到配置文件，将使用默认值和命令行参数\n'));
    process.stdout.write(chalk.gray('  搜索的文件名:\n'));
    for (const f of CONFIG_FILE_NAMES) {
      process.stdout.write(chalk.gray(`    - ${f}\n`));
    }
    process.stdout.write('\n');
  }

  process.stdout.write(chalk.cyan('── 配置值 ──\n\n'));
  printConfigDiff(DEFAULT_CONFIG, fileConfig || {}, cleanCLI(cliOptions), effective);

  process.stdout.write('\n' + chalk.gray(bar) + '\n');
  process.stdout.write(chalk.cyan('\n提示: 运行 ') + chalk.bold('md-link-checker init') + chalk.cyan(' 生成配置文件模板\n'));
  process.stdout.write(chalk.cyan('提示: 命令行参数始终覆盖配置文件中的同名字段\n\n'));
}

function cleanCLI(cliOptions) {
  const out = {};
  for (const [k, v] of Object.entries(cliOptions)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

function buildDisplayConfig(effective) {
  const safe = {};
  for (const [k, v] of Object.entries(effective)) {
    if (!k.startsWith('_')) safe[k] = v;
  }
  return safe;
}

function printConfigDiff(defaults, file, cli, effective) {
  const allKeys = new Set([
    ...Object.keys(defaults),
    ...Object.keys(file),
    ...Object.keys(cli),
    ...Object.keys(effective)
  ]);

  const displayKeys = [...allKeys].filter(k => !k.startsWith('_')).sort();

  for (const key of displayKeys) {
    const dVal = defaults[key];
    const fVal = file[key];
    const cVal = cli[key];
    const eVal = effective[key];
    const fromFile = fVal !== undefined;
    const fromCLI = cVal !== undefined;

    let source;
    if (fromCLI) source = chalk.magenta.bold('[CLI]');
    else if (fromFile) source = chalk.blue.bold('[文件]');
    else source = chalk.gray('[默认]');

    const val = formatValue(eVal);
    process.stdout.write(`  ${source} ${chalk.bold(key)} = ${val}\n`);

    if (fromFile && !fromCLI && !deepEqual(fVal, dVal)) {
      process.stdout.write(`         ${chalk.gray('默认:')} ${formatValue(dVal)} ${chalk.blue('→ 已在配置文件覆盖')}\n`);
    }
    if (fromCLI) {
      const prior = fromFile ? fVal : dVal;
      if (!deepEqual(cVal, prior)) {
        process.stdout.write(`         ${chalk.gray(fromFile ? '文件值:' : '默认值:')} ${formatValue(prior)} ${chalk.magenta('→ 已在命令行覆盖')}\n`);
      }
    }
  }
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  try { return JSON.stringify(a) === JSON.stringify(b); } catch { return false; }
}

function formatValue(v) {
  if (v === undefined) return chalk.gray('undefined');
  if (v === null) return 'null';
  if (typeof v === 'string') return chalk.green(`"${v}"`);
  if (typeof v === 'number' || typeof v === 'boolean') return chalk.yellow(String(v));
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    if (v.length <= 3) return '[' + v.map(x => formatValue(x)).join(', ') + ']';
    return `[${v.length} items]`;
  }
  if (typeof v === 'object') return `{${Object.keys(v).length} keys}`;
  return String(v);
}

async function configPathsCommand() {
  const cwd = process.cwd();
  const found = findConfigFile(cwd);

  process.stdout.write(chalk.bold('\n  配置文件搜索路径:\n\n'));
  process.stdout.write(`  当前工作目录: ${chalk.cyan(cwd)}\n\n`);

  process.stdout.write(chalk.bold('  支持的文件名 (按优先级):\n'));
  for (let i = 0; i < CONFIG_FILE_NAMES.length; i++) {
    const name = CONFIG_FILE_NAMES[i];
    const resolved = path.join(cwd, name);
    const exists = found === resolved;
    const mark = exists ? chalk.green('  ✓') : chalk.gray('   ');
    process.stdout.write(`  ${String(i+1).padStart(2)}. ${mark} ${name}\n`);
  }
  process.stdout.write('\n');

  if (found) {
    process.stdout.write(chalk.green('✓ 当前生效: ') + found + '\n');
  } else {
    process.stdout.write(chalk.yellow('⚠  未找到配置文件\n'));
  }
  process.stdout.write('\n');
}

module.exports = { configShowCommand, configPathsCommand };
