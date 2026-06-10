'use strict';

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const { EXIT_CODES } = require('../utils/constants');
const { buildConfig, describeConfigSources, findConfigFile } = require('../core/config');
const { createStructuredLogger } = require('../utils/logger');
const { runScan } = require('../core/scanner-runner');
const { render, getExitCode, writeOutput } = require('../reporters');
const { confirmDangerous } = require('../utils/confirm');

async function scanCommand(cmd, opts = {}) {
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
    dryRun: cmd.dryRun,
    confirmDangerous: cmd.yes ? false : undefined,
    recursive: cmd.recursive,
    fileExtensions: cmd.ext,
    output: cmd.output,
    configFile: cmd.config,
    logLevel: cmd.logLevel
  };

  const logger = createStructuredLogger({
    level: cliOptions.logLevel || 'info',
    json: cliOptions.format === 'json',
    quiet: cliOptions.quiet,
    verbose: cliOptions.verbose
  });

  let config;
  try {
    config = buildConfig({ cliOptions, logger });
  } catch (err) {
    logger.error(err.message);
    process.exit(err.exitCode || EXIT_CODES.CONFIG_ERROR);
  }

  if (!cmd.quiet && !config.quiet) {
    logger.info('配置来源: ' + describeConfigSources(config));
    if (config._configSources.file) {
      logger.info('使用配置文件: ' + config._configSources.file);
    }
  }

  if (cmd.preview || config.dryRun) {
    return runPreviewScan(config, logger, cmd);
  }

  if (config.confirmDangerous) {
    const needsConfirm = (config.checkExternal && config.timeout > 10000)
      || (config.concurrency > 32);
    if (needsConfirm) {
      const confirm = await confirmDangerous({
        operation: '大规模链接扫描',
        description: '当前配置包含可能对外部网络造成较大压力的参数，是否继续？',
        affected: ['timeout=' + config.timeout + 'ms', 'concurrency=' + config.concurrency],
        examples: [
          config.checkExternal ? '将发起外部 HTTP 请求检查' : '不检查外部链接',
          '建议在 CI 环境使用 --yes 跳过确认'
        ],
        autoConfirm: !config.confirmDangerous
      });
      if (!confirm.confirmed) {
        process.exit(EXIT_CODES.USER_ABORT);
      }
    }
  }

  let scanResult;
  try {
    scanResult = await runScan(config, logger);
  } catch (err) {
    logger.error('扫描失败: ' + err.message);
    if (config.verbose) logger.error(err.stack);
    process.exit(err.exitCode || EXIT_CODES.SCAN_ERROR);
  }

  const output = render(scanResult, config.format);
  const exitCode = getExitCode(scanResult);

  if (config.format === 'json') {
    process.stdout.write(output + '\n');
  } else {
    process.stdout.write(output);
  }

  if (config.output) {
    const writtenPath = writeOutput(output, config.output);
    logger.info(`报告已写入: ${writtenPath}`);
  }

  process.exitCode = exitCode;
}

async function runPreviewScan(config, logger, cmd) {
  const { collectMarkdownFiles } = require('../core/scanner');
  const { IgnoreEngine } = require('../core/ignore');
  const path = require('path');

  const rootDir = path.resolve(config.root);
  const ignoreEngine = new IgnoreEngine({
    ignore: config.ignore,
    ignorePatterns: config.ignorePatterns,
    ignoreFiles: config.ignoreFiles,
    root: rootDir
  });

  const files = collectMarkdownFiles(rootDir, {
    recursive: config.recursive,
    fileExtensions: config.fileExtensions
  }, ignoreEngine);

  const relative = files.map(f => path.relative(rootDir, f));

  const examples = [];
  examples.push(`根目录: ${rootDir}`);
  examples.push(`递归扫描: ${config.recursive ? '是' : '否'}`);
  examples.push(`文件扩展名: ${config.fileExtensions.join(', ')}`);
  if (config.checkExternal) examples.push('检查外部 URL: 是 (可能较慢)');
  if (config.checkAnchors) examples.push('检查锚点: 是');
  if (config.checkImages) examples.push('检查图片: 是');
  examples.push(`请求超时: ${config.timeout}ms, 并发: ${config.concurrency}`);

  const confirm = await confirmDangerous({
    operation: 'Markdown 链接扫描 (预览)',
    description: '以下扫描参数将被使用，确认执行？',
    affected: relative,
    examples,
    dryRun: false,
    autoConfirm: cmd.yes || false
  });

  if (!confirm.confirmed) {
    logger.info('已取消。使用 --yes 跳过确认直接执行扫描。');
    process.exit(EXIT_CODES.USER_ABORT);
  }

  let scanResult;
  try {
    scanResult = await runScan(config, logger);
  } catch (err) {
    logger.error('扫描失败: ' + err.message);
    process.exit(err.exitCode || EXIT_CODES.SCAN_ERROR);
  }

  const output = render(scanResult, config.format);
  const exitCode = getExitCode(scanResult);

  if (config.format === 'json') {
    process.stdout.write(output + '\n');
  } else {
    process.stdout.write(output);
  }

  if (config.output) {
    writeOutput(output, config.output);
  }

  process.exitCode = exitCode;
}

module.exports = { scanCommand };
