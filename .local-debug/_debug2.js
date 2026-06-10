'use strict';
const path = require('path');
const { buildConfig } = require('./src/core/config');

const cmd = {
  root: './fixtures',
  timeout: 1,
  format: 'json',
  ignore: undefined,
  ignorePattern: undefined,
  ignoreFile: undefined,
  concurrency: undefined,
  checkAnchors: undefined,
  checkExternal: undefined,
  checkImages: undefined,
  verbose: undefined,
  quiet: undefined,
  dryRun: undefined,
  yes: undefined,
  recursive: undefined,
  ext: undefined,
  output: undefined,
  config: './examples/.mdlinkcheckerrc.json',
  logLevel: 'silent'
};

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

const cfg = buildConfig({ cliOptions });
console.log('\n=== scan 命令收到的最终配置（关键测试） ===');
console.log('checkExternal:', cfg.checkExternal, '← 必须是 false（JSON 配置），如果是 true 就是 bug');
console.log('checkAnchors:', cfg.checkAnchors);
console.log('checkImages:', cfg.checkImages);
console.log('timeout:', cfg.timeout);
console.log('recursive:', cfg.recursive);
console.log('format:', cfg.format);
console.log('ignoreFiles:', cfg.ignoreFiles);
console.log('配置文件路径:', cfg._configSources.file);
console.log('CLI 标记来源:', cfg._configSources.cli ? '是（CLI传了非空参数）' : '否');

if (cfg.checkExternal === false) {
  console.log('\n✅ PASS: checkExternal 正确保持 false（来自 JSON 配置，未被覆盖）');
} else {
  console.log('\n❌ FAIL: checkExternal 仍然是 true！配置优先级有 bug');
  process.exit(1);
}
