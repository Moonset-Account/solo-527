'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { RESULT_STATUS, LINK_TYPES, EXIT_CODES } = require('../utils/constants');

const STATUS_LABELS = {
  [RESULT_STATUS.OK]: chalk.green('✓ PASS'),
  [RESULT_STATUS.BROKEN]: chalk.red('✗ FAIL'),
  [RESULT_STATUS.SKIPPED]: chalk.gray('○ SKIP'),
  [RESULT_STATUS.IGNORED]: chalk.gray('⊘ IGNR'),
  [RESULT_STATUS.WARNING]: chalk.yellow('⚠ WARN')
};

const TYPE_LABELS = {
  [LINK_TYPES.INTERNAL_FILE]: '文件',
  [LINK_TYPES.INTERNAL_ANCHOR]: '锚点',
  [LINK_TYPES.EXTERNAL_URL]: '外链',
  [LINK_TYPES.IMAGE]: '图片',
  [LINK_TYPES.MAILTO]: '邮件'
};

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const sec = (ms / 1000).toFixed(2);
  return `${sec}s`;
}

function renderText(scanResult, opts = {}) {
  const { useColor = chalk.supportsColor !== false, showAll = false } = opts;
  const lines = [];
  const localChalk = useColor ? chalk : new chalk.Instance({ level: 0 });

  lines.push(localChalk.bold('\n=== Markdown 文档链接检查报告 ==='));
  lines.push(`根目录: ${scanResult.root}`);
  lines.push(`扫描时间: ${scanResult.startedAt} ~ ${scanResult.completedAt} (${formatDuration(scanResult.durationMs)})`);
  lines.push('');

  const s = scanResult.summary;
  lines.push(localChalk.bold('📊 摘要'));
  lines.push(`  文件总数:     ${s.fileCount} (已扫描 ${s.scannedFiles}, 读取错误 ${s.errorFiles})`);
  lines.push(`  链接总数:     ${s.total}`);
  lines.push(`  ✓ 通过:       ${localChalk.green(s.okCount)}`);
  lines.push(`  ✗ 失败:       ${s.brokenCount > 0 ? localChalk.red.bold(s.brokenCount) : s.brokenCount}`);
  lines.push(`  ⚠  警告:       ${s.warningCount > 0 ? localChalk.yellow(s.warningCount) : s.warningCount}`);
  lines.push(`  ⊘  忽略:       ${s.ignoredCount}`);
  lines.push(`  ○  跳过:       ${s.skippedCount}`);
  lines.push(`  ───────────────────`);
  lines.push(`  已检查链接:   ${s.checkedCount}`);
  lines.push('');

  const brokenLinks = [];
  const warningLinks = [];
  const ignoredLinks = [];

  for (const f of scanResult.files) {
    for (const link of f.links) {
      if (link.status === RESULT_STATUS.BROKEN) brokenLinks.push({ file: f, link });
      else if (link.status === RESULT_STATUS.WARNING) warningLinks.push({ file: f, link });
      else if (link.status === RESULT_STATUS.IGNORED) ignoredLinks.push({ file: f, link });
    }
  }

  if (brokenLinks.length > 0) {
    lines.push(localChalk.red.bold(`❌ 坏链 (${brokenLinks.length}):`));
    for (const { file, link } of brokenLinks) {
      lines.push('');
      lines.push(`  ${STATUS_LABELS[link.status]}  ${localChalk.cyan(file.file)}:${localChalk.magenta(link.line)}`);
      lines.push(`    类型: ${TYPE_LABELS[link.type] || link.type}`);
      lines.push(`    文本: ${localChalk.gray(truncate(link.text || '(无)', 60))}`);
      lines.push(`    链接: ${localChalk.bold(link.raw)}`);
      if (link.details?.reason) lines.push(`    原因: ${localChalk.red(link.details.reason)}`);
      if (link.details?.resolvedPath) lines.push(`    解析后: ${link.details.resolvedPath}`);
      if (link.details?.suggestions && link.details.suggestions.length) {
        lines.push(`    相似锚点: ${link.details.suggestions.map(s => '#' + s).join(', ')}`);
      }
    }
    lines.push('');
  }

  if (warningLinks.length > 0) {
    lines.push(localChalk.yellow.bold(`⚠  警告 (${warningLinks.length}):`));
    for (const { file, link } of warningLinks) {
      lines.push(`  ${STATUS_LABELS[link.status]}  ${localChalk.cyan(file.file)}:${link.line}  ${link.raw}`);
      if (link.details?.warning) lines.push(`    ${localChalk.yellow(link.details.warning)}`);
    }
    lines.push('');
  }

  if (ignoredLinks.length > 0 && showAll) {
    lines.push(localChalk.gray.bold(`⊘  已忽略 (${ignoredLinks.length}):`));
    for (const { file, link } of ignoredLinks) {
      lines.push(`  ${STATUS_LABELS[link.status]}  ${file.file}:${link.line}  ${link.raw}`);
    }
    lines.push('');
  }

  if (s.errorFiles > 0) {
    lines.push(localChalk.red.bold('⚠  读取错误的文件:'));
    for (const f of scanResult.files) {
      if (f.error) lines.push(`  - ${f.file}: ${f.error}`);
    }
    lines.push('');
  }

  if (s.brokenCount === 0) {
    lines.push(localChalk.green.bold('🎉 全部检查通过！'));
  } else {
    lines.push(localChalk.red.bold(`❌ 检测到 ${s.brokenCount} 个坏链，需要修复。`));
  }
  lines.push('');

  return lines.join('\n');
}

function truncate(s, n) {
  if (!s) return '';
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function renderJSON(scanResult) {
  return JSON.stringify(scanResult, null, 2);
}

function renderMarkdown(scanResult) {
  const lines = [];
  const s = scanResult.summary;

  lines.push('# Markdown 文档链接检查报告');
  lines.push('');
  lines.push(`- **根目录**: \`${scanResult.root}\``);
  lines.push(`- **扫描时间**: ${scanResult.startedAt} ~ ${scanResult.completedAt}`);
  lines.push(`- **总耗时**: ${formatDuration(scanResult.durationMs)}`);
  lines.push('');

  lines.push('## 摘要');
  lines.push('');
  lines.push('| 指标 | 数量 |');
  lines.push('| --- | ---: |');
  lines.push(`| 文件总数 | ${s.fileCount} |`);
  lines.push(`| 链接总数 | ${s.total} |`);
  lines.push(`| ✅ 通过 | ${s.okCount} |`);
  lines.push(`| ❌ 失败 | ${s.brokenCount} |`);
  lines.push(`| ⚠️ 警告 | ${s.warningCount} |`);
  lines.push(`| ⊘ 忽略 | ${s.ignoredCount} |`);
  lines.push(`| ○ 跳过 | ${s.skippedCount} |`);
  lines.push('');

  const broken = [];
  for (const f of scanResult.files) {
    for (const link of f.links) {
      if (link.status === RESULT_STATUS.BROKEN) broken.push({ file: f, link });
    }
  }

  if (broken.length > 0) {
    lines.push('## ❌ 坏链详情');
    lines.push('');
    lines.push('| 文件 | 行号 | 类型 | 链接 | 原因 |');
    lines.push('| --- | ---: | --- | --- | --- |');
    for (const { file, link } of broken) {
      lines.push(`| \`${file.file}\` | ${link.line} | ${TYPE_LABELS[link.type] || link.type} | \`${escapeMD(link.raw)}\` | ${escapeMD(link.details?.reason || '')} |`);
    }
    lines.push('');
  }

  const warnings = [];
  for (const f of scanResult.files) {
    for (const link of f.links) {
      if (link.status === RESULT_STATUS.WARNING) warnings.push({ file: f, link });
    }
  }
  if (warnings.length > 0) {
    lines.push('## ⚠️ 警告');
    lines.push('');
    lines.push('| 文件 | 行号 | 链接 | 说明 |');
    lines.push('| --- | ---: | --- | --- |');
    for (const { file, link } of warnings) {
      lines.push(`| \`${file.file}\` | ${link.line} | \`${escapeMD(link.raw)}\` | ${escapeMD(link.details?.warning || '')} |`);
    }
    lines.push('');
  }

  if (s.brokenCount === 0) {
    lines.push('## ✅ 检查结果');
    lines.push('');
    lines.push('**全部通过！** 未发现坏链。');
  } else {
    lines.push('## ❌ 检查结果');
    lines.push('');
    lines.push(`检测到 **${s.brokenCount}** 个坏链，需要修复。`);
  }

  return lines.join('\n') + '\n';
}

function escapeMD(s) {
  return String(s || '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function render(scanResult, format, opts = {}) {
  switch (format) {
    case 'json': return renderJSON(scanResult);
    case 'markdown': return renderMarkdown(scanResult);
    case 'text':
    default: return renderText(scanResult, opts);
  }
}

function getExitCode(scanResult) {
  const s = scanResult.summary;
  if (s.errorFiles > 0 && s.scannedFiles === 0) return EXIT_CODES.SCAN_ERROR;
  if (s.brokenCount > 0) return EXIT_CODES.BAD_LINKS_FOUND;
  return EXIT_CODES.SUCCESS;
}

function writeOutput(output, filePath) {
  if (!filePath) return null;
  const abs = path.resolve(filePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, output, 'utf-8');
  return abs;
}

module.exports = {
  render,
  renderText,
  renderJSON,
  renderMarkdown,
  getExitCode,
  writeOutput
};
