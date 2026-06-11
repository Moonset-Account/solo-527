'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml'];

class ConfigParseError extends Error {
  constructor(message, filePath, details) {
    super(message);
    this.name = 'ConfigParseError';
    this.filePath = filePath;
    this.details = details;
  }
}

function detectFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.yaml' || ext === '.yml') return 'yaml';
  throw new ConfigParseError(
    `不支持的文件格式: ${ext}。支持的格式: ${SUPPORTED_EXTENSIONS.join(', ')}`,
    filePath
  );
}

function resolvePath(filePath) {
  if (!filePath) {
    throw new ConfigParseError('文件路径不能为空');
  }
  return path.resolve(process.cwd(), filePath);
}

function parseJSON(content, filePath) {
  try {
    return JSON.parse(content);
  } catch (err) {
    const match = err.message.match(/position (\d+)/);
    let lineInfo = '';
    if (match) {
      const position = parseInt(match[1], 10);
      const lines = content.substring(0, position).split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      lineInfo = ` (行 ${line}, 列 ${column})`;
    }
    throw new ConfigParseError(
      `JSON 解析错误: ${err.message}${lineInfo}`,
      filePath,
      { originalError: err.message }
    );
  }
}

function parseYAML(content, filePath) {
  try {
    return yaml.load(content, { filename: filePath, schema: yaml.DEFAULT_SCHEMA });
  } catch (err) {
    const lineInfo = err.mark ? ` (行 ${err.mark.line + 1}, 列 ${err.mark.column + 1})` : '';
    throw new ConfigParseError(
      `YAML 解析错误: ${err.message}${lineInfo}`,
      filePath,
      {
        originalError: err.message,
        line: err.mark ? err.mark.line + 1 : null,
        column: err.mark ? err.mark.column + 1 : null
      }
    );
  }
}

function parseContent(content, format, filePath) {
  if (format === 'json') {
    return parseJSON(content, filePath);
  }
  return parseYAML(content, filePath);
}

function parseFile(filePath) {
  const resolvedPath = resolvePath(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new ConfigParseError(
      `文件不存在: ${resolvedPath}`,
      resolvedPath
    );
  }

  try {
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      throw new ConfigParseError(
        `路径不是文件: ${resolvedPath}`,
        resolvedPath
      );
    }
  } catch (err) {
    if (err instanceof ConfigParseError) throw err;
    throw new ConfigParseError(
      `无法访问文件: ${resolvedPath} - ${err.message}`,
      resolvedPath
    );
  }

  let content;
  try {
    content = fs.readFileSync(resolvedPath, 'utf8');
  } catch (err) {
    throw new ConfigParseError(
      `读取文件失败: ${resolvedPath} - ${err.message}`,
      resolvedPath
    );
  }

  if (!content.trim()) {
    return {
      path: resolvedPath,
      format: detectFormat(resolvedPath),
      data: {},
      size: content.length
    };
  }

  const format = detectFormat(resolvedPath);
  const data = parseContent(content, format, resolvedPath);

  return {
    path: resolvedPath,
    format,
    data: data || {},
    size: content.length
  };
}

function parseString(content, format = 'json', sourceName = 'inline') {
  if (!content || !content.trim()) {
    return {};
  }
  return parseContent(content, format, sourceName);
}

function serialize(data, format = 'json', pretty = true) {
  if (format === 'json') {
    return pretty
      ? JSON.stringify(data, null, 2) + '\n'
      : JSON.stringify(data);
  }
  return yaml.dump(data, {
    indent: 2,
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
}

module.exports = {
  SUPPORTED_EXTENSIONS,
  ConfigParseError,
  detectFormat,
  resolvePath,
  parseJSON,
  parseYAML,
  parseContent,
  parseFile,
  parseString,
  serialize
};
