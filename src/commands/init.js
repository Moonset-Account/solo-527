'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { EXIT_CODES } = require('../utils/constants');

const DEFAULT_CONFIG_TEMPLATE = `# md-link-checker 配置文件
# 配置优先级：命令行参数 > 本文件 > 内置默认值
# 支持的文件格式: .mdlinkcheckerrc.json / .mdlinkcheckerrc.yaml / mdlinkchecker.config.js

# 扫描的根目录
root: ./

# 外部链接请求超时 (毫秒)
timeout: 5000

# 输出格式: text | json | markdown
format: text

# 并发请求数 (用于外部链接检查)
concurrency: 8

# 是否递归扫描子目录
recursive: true

# 要扫描的文件扩展名
fileExtensions:
  - .md
  - .markdown

# --- 检查开关 ---
checkAnchors: true       # 检查内部锚点 (#heading)
checkExternal: true      # 检查外部 URL (http/https)
checkImages: true        # 检查图片引用

# --- 忽略规则 ---
# 忽略特定链接 (支持 glob 模式或精确路径)
ignore:
  - "https://example.com/*"
  - "node_modules/**"

# 忽略链接的正则表达式 (针对链接原始字符串匹配)
ignorePatterns:
  - "^https?://localhost"
  - "^https?://127\\.0\\.0\\.1"
  - "^javascript:"

# 忽略特定 Markdown 文件 (支持 glob 或路径)
ignoreFiles:
  - "CHANGELOG.md"
  - "docs/archive/**"

# --- 日志 ---
logLevel: info           # debug | info | warn | error | silent
verbose: false
quiet: false

# 其他
confirmDangerous: true   # 危险操作前需要确认
dryRun: false            # 只预览不执行
`;

async function initCommand(cmd) {
  const cwd = process.cwd();
  const outFormat = (cmd.format || 'yaml').toLowerCase();
  const force = cmd.force || false;

  let fileName, content;
  switch (outFormat) {
    case 'json':
      fileName = '.mdlinkcheckerrc.json';
      content = JSON.stringify(buildJSONConfig(), null, 2) + '\n';
      break;
    case 'js':
    case 'javascript':
      fileName = 'mdlinkchecker.config.js';
      content = buildJSConfig();
      break;
    case 'yaml':
    case 'yml':
    default:
      fileName = '.mdlinkcheckerrc.yaml';
      content = DEFAULT_CONFIG_TEMPLATE;
  }

  const targetPath = path.resolve(cmd.output || path.join(cwd, fileName));

  if (fs.existsSync(targetPath) && !force) {
    process.stderr.write(chalk.red(`✗ 文件已存在: ${targetPath}\n`));
    process.stderr.write('使用 --force 覆盖，或使用 --output 指定其他路径\n');
    process.exit(EXIT_CODES.INVALID_ARGUMENTS);
  }

  try {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, content, 'utf-8');
  } catch (e) {
    process.stderr.write(chalk.red(`✗ 写入失败: ${e.message}\n`));
    process.exit(EXIT_CODES.SCAN_ERROR);
  }

  process.stderr.write(chalk.green(`✓ 已生成配置文件: ${targetPath}\n\n`));
  process.stderr.write('下一步:\n');
  process.stderr.write(`  1. 编辑配置以匹配您的项目\n`);
  process.stderr.write(`  2. 运行 ${chalk.cyan('md-link-checker scan')} 开始扫描\n`);
  process.stderr.write(`  3. 运行 ${chalk.cyan('md-link-checker scan --preview')} 预览扫描范围\n`);
  process.stderr.write(`  4. 运行 ${chalk.cyan('md-link-checker config show')} 查看有效配置\n\n`);
  process.stderr.write('示例命令:\n');
  process.stderr.write(`  md-link-checker scan --root ./docs --format json\n`);
  process.stderr.write(`  md-link-checker scan --ignore "https://*.example.com/*" --output report.md\n`);
}

function buildJSONConfig() {
  return {
    root: './',
    timeout: 5000,
    format: 'text',
    concurrency: 8,
    recursive: true,
    fileExtensions: ['.md', '.markdown'],
    checkAnchors: true,
    checkExternal: true,
    checkImages: true,
    ignore: [
      'https://example.com/*',
      'node_modules/**'
    ],
    ignorePatterns: [
      '^https?://localhost',
      '^javascript:'
    ],
    ignoreFiles: [
      'CHANGELOG.md',
      'docs/archive/**'
    ],
    logLevel: 'info',
    verbose: false,
    quiet: false,
    confirmDangerous: true,
    dryRun: false
  };
}

function buildJSConfig() {
  return `/** @type {import('md-link-checker').MDLinkCheckerConfig} */
module.exports = {
  // 扫描的根目录 (相对或绝对路径)
  root: './',

  // 外部链接请求超时 (毫秒)
  timeout: 5000,

  // 输出格式: 'text' | 'json' | 'markdown'
  format: 'text',

  // 并发检查数
  concurrency: 8,

  // 是否递归扫描
  recursive: true,

  // 扫描的文件扩展名
  fileExtensions: ['.md', '.markdown'],

  // === 检查开关 ===
  checkAnchors: true,       // 检查标题锚点
  checkExternal: true,      // 检查外部链接 (需要网络)
  checkImages: true,        // 检查图片文件存在性

  // === 忽略规则 ===
  // 单个链接忽略 (glob 或精确匹配)
  ignore: [
    'https://example.com/*',
    'node_modules/**',
  ],

  // 链接正则忽略 (对 raw link 进行匹配)
  ignorePatterns: [
    /^https?:\\/\\/localhost/,
    /^javascript:/,
  ],

  // 忽略整个 Markdown 文件
  ignoreFiles: [
    'CHANGELOG.md',
    'docs/archive/**',
  ],

  // 日志级别
  logLevel: 'info',
  verbose: false,
  quiet: false,

  // 危险操作确认
  confirmDangerous: true,
  dryRun: false,

  // 配置文件支持函数形式，返回动态配置
  // (环境变量等可以在这里读取)
};
`;
}

module.exports = { initCommand };
