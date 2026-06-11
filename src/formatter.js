'use strict';

const chalk = require('chalk');
const _ = require('lodash');

function formatSummary(summary, options = {}) {
  const {
    useColor = process.stdout.isTTY,
    detailed = false,
    machineReadable = false
  } = options;

  if (machineReadable) {
    return JSON.stringify(summary, null, 2);
  }

  let c;
  if (useColor) {
    c = chalk;
  } else {
    const identity = (s) => s;
    const makeProxy = () => new Proxy(identity, {
      get: () => makeProxy()
    });
    c = makeProxy();
  }
  const lines = [];

  lines.push('');
  lines.push(c.bold('═══ 合并摘要 ═══'));
  lines.push('');

  const stats = [
    { label: '处理的配置项数', value: summary.processedCount, color: 'cyan' },
    { label: '新增配置项', value: summary.addedCount, color: 'green' },
    { label: '覆盖配置项', value: summary.overwrittenCount, color: 'yellow' },
    { label: '移除配置项', value: summary.removedCount, color: 'red' },
    { label: '跳过（敏感）', value: summary.skippedCount, color: 'gray' },
    { label: '失败项', value: summary.failedCount, color: 'red' }
  ];

  for (const stat of stats) {
    const icon = stat.value > 0 ? '▸' : ' ';
    lines.push(`${icon} ${c[stat.color](stat.label.padEnd(16))}: ${c.bold(stat.value)}`);
  }

  lines.push('');

  if (summary.conflictCount > 0) {
    lines.push(c.yellow.bold(`⚠  检测到 ${summary.conflictCount} 个潜在冲突`));
  } else {
    lines.push(c.green.bold('✓  未检测到配置冲突'));
  }

  if (summary.validationErrors > 0) {
    lines.push(c.red.bold(`✗  Schema 校验失败: ${summary.validationErrors} 个错误`));
  } else if (summary.schemaValidated) {
    lines.push(c.green.bold('✓  Schema 校验通过'));
  }

  if (summary.outputFile) {
    lines.push('');
    lines.push(c.gray(`输出文件: ${summary.outputFile}`));
  }

  lines.push('');

  if (detailed && summary.details) {
    lines.push(c.bold('── 详细信息 ──'));
    lines.push('');

    if (summary.details.addedKeys && summary.details.addedKeys.length > 0) {
      lines.push(c.green('新增的配置项:'));
      for (const key of summary.details.addedKeys) {
        lines.push(`  + ${key}`);
      }
      lines.push('');
    }

    if (summary.details.overwrittenKeys && summary.details.overwrittenKeys.length > 0) {
      lines.push(c.yellow('覆盖的配置项:'));
      for (const key of summary.details.overwrittenKeys) {
        lines.push(`  ~ ${key}`);
      }
      lines.push('');
    }

    if (summary.details.removedKeys && summary.details.removedKeys.length > 0) {
      lines.push(c.red('移除的配置项:'));
      for (const key of summary.details.removedKeys) {
        lines.push(`  - ${key}`);
      }
      lines.push('');
    }

    if (summary.details.conflicts && summary.details.conflicts.length > 0) {
      lines.push(c.yellow('冲突详情:'));
      for (const conflict of summary.details.conflicts) {
        const typeTag = conflict.type ? `[${conflict.type}]` : '';
        lines.push(`  ⚠  ${typeTag} ${conflict.path}`);
        lines.push(`      base:    ${JSON.stringify(conflict.baseValue)}`);
        lines.push(`      overlay: ${JSON.stringify(conflict.overlayValue)}`);
        if (conflict.source) {
          lines.push(`      source:  ${conflict.source}`);
        }
      }
      lines.push('');
    }

    if (summary.details.maskedKeys && summary.details.maskedKeys.length > 0) {
      lines.push(c.gray('已脱敏的敏感键:'));
      for (const item of summary.details.maskedKeys) {
        lines.push(`  🔒 ${item.key}`);
      }
      lines.push('');
    }

    if (summary.details.validationErrors && summary.details.validationErrors.length > 0) {
      lines.push(c.red('Schema 校验错误:'));
      for (const err of summary.details.validationErrors) {
        lines.push(`  ✗ ${err.path}: ${err.message}`);
      }
      lines.push('');
    }
  }

  lines.push(c.bold('═══ 完成 ═══'));
  lines.push('');

  return lines.join('\n');
}

function formatPreview(mergeResult, options = {}) {
  const {
    useColor = process.stdout.isTTY,
    showDiff = true,
    maxDepth = 10
  } = options;

  let c;
  if (useColor) {
    c = chalk;
  } else {
    const identity = (s) => s;
    const makeProxy = () => new Proxy(identity, {
      get: () => makeProxy()
    });
    c = makeProxy();
  }
  const lines = [];

  const overwrittenSet = new Set(mergeResult.overwrittenKeys || []);
  const addedSet = new Set(mergeResult.addedKeys || []);
  const removedSet = new Set(mergeResult.removedKeys || []);

  function formatValue(value, depth = 0, prefix = '') {
    const indent = '  '.repeat(depth);

    if (value === null || value === undefined) {
      return c.gray(`${indent}${prefix}null`);
    }

    if (typeof value !== 'object') {
      if (typeof value === 'string') {
        return c.cyan(`${indent}${prefix}"${value}"`);
      }
      if (typeof value === 'number') {
        return c.magenta(`${indent}${prefix}${value}`);
      }
      if (typeof value === 'boolean') {
        return c.yellow(`${indent}${prefix}${value}`);
      }
      return `${indent}${prefix}${value}`;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return `${indent}${prefix}[]`;
      }
      const arrLines = [`${indent}${prefix}[`];
      for (let i = 0; i < value.length; i++) {
        const comma = i < value.length - 1 ? ',' : '';
        arrLines.push(formatValue(value[i], depth + 1, '') + comma);
      }
      arrLines.push(`${indent}]`);
      return arrLines.join('\n');
    }

    const keys = Object.keys(value);
    if (keys.length === 0) {
      return `${indent}${prefix}{}`;
    }

    const objLines = [`${indent}${prefix}{`];
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const fullPath = prefix ? `${prefix.split('\n').pop().trim()}${key}` : key;
      const comma = i < keys.length - 1 ? ',' : '';
      let marker = '  ';
      let keyColor = 'white';

      if (showDiff) {
        if (overwrittenSet.has(key) || Array.from(overwrittenSet).some(k => k.endsWith(`.${key}`) || k === key)) {
          marker = c.yellow('~ ');
          keyColor = 'yellow';
        } else if (addedSet.has(key) || Array.from(addedSet).some(k => k.endsWith(`.${key}`) || k === key)) {
          marker = c.green('+ ');
          keyColor = 'green';
        }
      }

      const childIndent = '  '.repeat(depth + 1);
      const formatted = formatValue(value[key], depth + 1, '');
      const keyStr = c[keyColor](`"${key}"`);

      if (typeof value[key] === 'object' && value[key] !== null) {
        const firstLine = formatted.split('\n')[0];
        const restLines = formatted.split('\n').slice(1).join('\n');
        objLines.push(`${indent}${marker}${childIndent}${keyStr}: ${firstLine}`);
        if (restLines) {
          objLines.push(restLines.split('\n').map(l => `${indent}${marker.replace(/./g, ' ')}${l}`).join('\n'));
        }
        objLines[objLines.length - 1] = objLines[objLines.length - 1] + comma;
      } else {
        objLines.push(`${indent}${marker}${childIndent}${keyStr}: ${formatted.trim()}${comma}`);
      }
    }
    objLines.push(`${indent}  }`);
    return objLines.join('\n');
  }

  lines.push('');
  lines.push(c.bold('── 合并结果预览 ──'));
  lines.push('');

  if (showDiff) {
    lines.push(c.gray('图例: ') + c.green('+ 新增') + '  ' + c.yellow('~ 修改') + '  ' + c.red('- 删除'));
    lines.push('');
  }

  lines.push(formatValue(mergeResult.data || {}));
  lines.push('');

  return lines.join('\n');
}

function formatError(error, options = {}) {
  const {
    useColor = process.stdout.isTTY,
    showStack = false
  } = options;

  let c;
  if (useColor) {
    c = chalk;
  } else {
    const identity = (s) => s;
    const makeProxy = () => new Proxy(identity, {
      get: () => makeProxy()
    });
    c = makeProxy();
  }
  const lines = [];

  lines.push('');
  lines.push(c.red.bold('═══ 错误 ═══'));
  lines.push('');

  if (error.name) {
    lines.push(c.red(`类型: ${error.name}`));
  }

  lines.push(c.red(`消息: ${error.message}`));

  if (error.filePath) {
    lines.push(c.gray(`文件: ${error.filePath}`));
  }

  if (error.line !== undefined || error.column !== undefined) {
    const pos = [
      error.line !== undefined ? `行 ${error.line}` : null,
      error.column !== undefined ? `列 ${error.column}` : null
    ].filter(Boolean).join(', ');
    if (pos) {
      lines.push(c.gray(`位置: ${pos}`));
    }
  }

  if (error.details && typeof error.details === 'object') {
    lines.push('');
    lines.push(c.bold('详细信息:'));
    for (const [k, v] of Object.entries(error.details)) {
      lines.push(`  ${k}: ${v}`);
    }
  }

  if (showStack && error.stack) {
    lines.push('');
    lines.push(c.gray('调用栈:'));
    lines.push(c.gray(error.stack.split('\n').slice(1).join('\n')));
  }

  lines.push('');

  if (error.filePath && error.line !== undefined) {
    lines.push(c.gray(`提示: 请检查 ${error.filePath} 的第 ${error.line} 行附近的内容`));
  } else if (error.filePath) {
    lines.push(c.gray(`提示: 请检查文件 ${error.filePath} 的内容格式是否正确`));
  }

  lines.push('');

  return lines.join('\n');
}

function buildSummary(mergeResult, options = {}) {
  const {
    schemaResult = null,
    outputFile = null,
    inputFiles = [],
    maskedKeys = []
  } = options;

  return {
    timestamp: new Date().toISOString(),
    inputFiles,
    outputFile,
    processedCount: mergeResult.processedCount || 0,
    addedCount: (mergeResult.addedKeys || []).length,
    overwrittenCount: (mergeResult.overwrittenKeys || []).length,
    removedCount: (mergeResult.removedKeys || []).length,
    skippedCount: mergeResult.skippedCount || 0,
    failedCount: mergeResult.failedCount || 0,
    conflictCount: (mergeResult.conflicts || []).length,
    schemaValidated: schemaResult !== null,
    schemaValid: schemaResult ? schemaResult.valid : null,
    validationErrors: schemaResult ? schemaResult.errorCount : 0,
    validationWarnings: schemaResult ? schemaResult.warningCount : 0,
    exitCode: (mergeResult.failedCount || 0) > 0 || (schemaResult && !schemaResult.valid) ? 1 : 0,
    details: {
      addedKeys: mergeResult.addedKeys || [],
      overwrittenKeys: mergeResult.overwrittenKeys || [],
      removedKeys: mergeResult.removedKeys || [],
      conflicts: mergeResult.conflicts || [],
      errors: mergeResult.errors || [],
      maskedKeys,
      validationErrors: schemaResult ? schemaResult.errors : [],
      validationWarnings: schemaResult ? schemaResult.warnings : []
    }
  };
}

module.exports = {
  formatSummary,
  formatPreview,
  formatError,
  buildSummary
};
