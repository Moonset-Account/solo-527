'use strict';

const fs = require('fs');
const path = require('path');
const { OUTPUT_FORMATS, ERROR_TYPES, SEVERITY } = require('./constants');
const { resolvePath } = require('./file-utils');

function generateSummary(checkResults) {
  const { keyCheck, placeholderCheck, lengthCheck, reviewCheck } = checkResults;
  const allErrors = [
    ...(keyCheck?.errors || []),
    ...(placeholderCheck?.errors || []),
    ...(lengthCheck?.errors || []),
    ...(reviewCheck?.errors || [])
  ];
  const allWarnings = [
    ...(keyCheck?.warnings || []),
    ...(placeholderCheck?.warnings || []),
    ...(lengthCheck?.warnings || []),
    ...(reviewCheck?.warnings || [])
  ];
  const errorCounts = {};
  for (const error of allErrors) {
    errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
  }
  const warningCounts = {};
  for (const warning of allWarnings) {
    warningCounts[warning.type] = (warningCounts[warning.type] || 0) + 1;
  }
  return {
    timestamp: new Date().toISOString(),
    totalErrors: allErrors.length,
    totalWarnings: allWarnings.length,
    errorCounts,
    warningCounts,
    stats: {
      keys: keyCheck?.stats || null,
      placeholders: placeholderCheck?.stats || null,
      length: lengthCheck?.stats || null,
      review: reviewCheck?.stats || null
    }
  };
}

function generateTextReport(checkResults, options = {}) {
  const summary = generateSummary(checkResults);
  const { keyCheck, placeholderCheck, lengthCheck, reviewCheck } = checkResults;
  const allErrors = [
    ...(keyCheck?.errors || []),
    ...(placeholderCheck?.errors || []),
    ...(lengthCheck?.errors || []),
    ...(reviewCheck?.errors || [])
  ];
  const allWarnings = [
    ...(keyCheck?.warnings || []),
    ...(placeholderCheck?.warnings || []),
    ...(lengthCheck?.warnings || []),
    ...(reviewCheck?.warnings || [])
  ];
  let output = '';
  output += '='.repeat(60) + '\n';
  output += '  多语言文案差异检查报告\n';
  output += '='.repeat(60) + '\n\n';
  output += `检查时间: ${summary.timestamp}\n`;
  output += `基准文件: ${options.basePath || 'N/A'}\n`;
  output += `目标文件: ${options.localePath || 'N/A'}\n\n`;
  output += '--- 摘要 ---\n';
  output += `总错误数: ${summary.totalErrors}\n`;
  output += `总警告数: ${summary.totalWarnings}\n\n`;
  if (summary.stats.keys) {
    output += '键统计:\n';
    output += `  基准键数: ${summary.stats.keys.totalBaseKeys}\n`;
    output += `  目标键数: ${summary.stats.keys.totalLocaleKeys}\n`;
    output += `  对齐键数: ${summary.stats.keys.alignedKeys}\n`;
    output += `  缺失键: ${summary.stats.keys.missingKeys}\n`;
    output += `  多余键: ${summary.stats.keys.extraKeys}\n`;
    output += `  空值: ${summary.stats.keys.emptyValues}\n\n`;
  }
  if (summary.stats.placeholders) {
    output += '占位符统计:\n';
    output += `  含占位符键数: ${summary.stats.placeholders.withPlaceholders}\n`;
    output += `  占位符错误: ${summary.stats.placeholders.placeholderErrors}\n\n`;
  }
  if (allErrors.length > 0) {
    output += '--- 错误明细 ---\n';
    for (const error of allErrors) {
      output += `\n[${error.severity.toUpperCase()}] ${error.message}\n`;
      output += `  类型: ${error.type}\n`;
      output += `  键: ${error.key}\n`;
      if (error.baseValue !== undefined) {
        output += `  基准值: ${JSON.stringify(error.baseValue)}\n`;
      }
      if (error.localeValue !== undefined) {
        output += `  目标值: ${JSON.stringify(error.localeValue)}\n`;
      }
      if (error.details) {
        for (const [key, value] of Object.entries(error.details)) {
          if (key === 'basePath' || key === 'localePath') continue;
          output += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      }
    }
    output += '\n';
  }
  if (allWarnings.length > 0) {
    output += '--- 警告明细 ---\n';
    for (const warning of allWarnings) {
      output += `\n[${warning.severity.toUpperCase()}] ${warning.message}\n`;
      output += `  类型: ${warning.type}\n`;
      output += `  键: ${warning.key}\n`;
      if (warning.details) {
        for (const [key, value] of Object.entries(warning.details)) {
          if (key === 'basePath' || key === 'localePath') continue;
          output += `  ${key}: ${JSON.stringify(value)}\n`;
        }
      }
    }
    output += '\n';
  }
  if (allErrors.length === 0 && allWarnings.length === 0) {
    output += '\n✓ 所有检查通过！\n';
  }
  output += '\n' + '='.repeat(60) + '\n';
  return output;
}

function generateJsonReport(checkResults, options = {}) {
  const summary = generateSummary(checkResults);
  const { keyCheck, placeholderCheck, lengthCheck, reviewCheck } = checkResults;
  const allErrors = [
    ...(keyCheck?.errors || []),
    ...(placeholderCheck?.errors || []),
    ...(lengthCheck?.errors || []),
    ...(reviewCheck?.errors || [])
  ];
  const allWarnings = [
    ...(keyCheck?.warnings || []),
    ...(placeholderCheck?.warnings || []),
    ...(lengthCheck?.warnings || []),
    ...(reviewCheck?.warnings || [])
  ];
  const report = {
    schemaVersion: '1.0',
    timestamp: summary.timestamp,
    metadata: {
      basePath: options.basePath || null,
      localePath: options.localePath || null,
      baseLocale: options.baseLocale || 'en',
      targetLocale: options.targetLocale || null
    },
    summary: {
      totalErrors: summary.totalErrors,
      totalWarnings: summary.totalWarnings,
      errorCounts: summary.errorCounts,
      warningCounts: summary.warningCounts,
      passed: summary.totalErrors === 0
    },
    stats: summary.stats,
    errors: allErrors.map(e => ({ ...e })),
    warnings: allWarnings.map(w => ({ ...w })),
    missingKeys: options.missingKeysData || null
  };
  return JSON.stringify(report, null, 2);
}

function generateCsvReport(checkResults, options = {}) {
  const { keyCheck, placeholderCheck, lengthCheck, reviewCheck } = checkResults;
  const allErrors = [
    ...(keyCheck?.errors || []),
    ...(placeholderCheck?.errors || []),
    ...(lengthCheck?.errors || []),
    ...(reviewCheck?.errors || [])
  ];
  const allWarnings = [
    ...(keyCheck?.warnings || []),
    ...(placeholderCheck?.warnings || []),
    ...(lengthCheck?.warnings || []),
    ...(reviewCheck?.warnings || [])
  ];
  const allItems = [
    ...allErrors.map(e => ({ ...e, isWarning: false })),
    ...allWarnings.map(w => ({ ...w, isWarning: true }))
  ];
  const headers = [
    'severity',
    'type',
    'key',
    'message',
    'baseValue',
    'localeValue',
    'details'
  ];
  let csv = headers.join(',') + '\n';
  for (const item of allItems) {
    const row = [
      item.isWarning ? 'warning' : item.severity,
      item.type,
      escapeCsv(item.key),
      escapeCsv(item.message),
      escapeCsv(item.baseValue !== undefined ? String(item.baseValue) : ''),
      escapeCsv(item.localeValue !== undefined ? String(item.localeValue) : ''),
      escapeCsv(item.details ? JSON.stringify(item.details) : '')
    ];
    csv += row.join(',') + '\n';
  }
  return csv;
}

function escapeCsv(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateReport(checkResults, format, options = {}) {
  switch (format) {
    case OUTPUT_FORMATS.JSON:
      return generateJsonReport(checkResults, options);
    case OUTPUT_FORMATS.CSV:
      return generateCsvReport(checkResults, options);
    case OUTPUT_FORMATS.TEXT:
    default:
      return generateTextReport(checkResults, options);
  }
}

function writeReport(report, filePath) {
  const resolved = resolvePath(filePath);
  const dir = path.dirname(resolved);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, report, 'utf8');
    return { success: true, path: resolved };
  } catch (error) {
    return {
      success: false,
      error: {
        message: `无法写入报告文件: ${resolved}`,
        details: error.message
      }
    };
  }
}

module.exports = {
  generateSummary,
  generateTextReport,
  generateJsonReport,
  generateCsvReport,
  generateReport,
  writeReport
};
