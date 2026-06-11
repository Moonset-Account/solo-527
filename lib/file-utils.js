'use strict';

const fs = require('fs');
const path = require('path');
const { EXIT_CODES, ERROR_TYPES } = require('./constants');

function normalizePath(filePath) {
  if (!filePath) return filePath;
  let normalized = filePath;
  if (process.platform === 'win32') {
    normalized = normalized.replace(/\//g, '\\');
  } else {
    normalized = normalized.replace(/\\/g, '/');
  }
  return path.normalize(normalized);
}

function resolvePath(filePath, cwd = process.cwd()) {
  const normalized = normalizePath(filePath);
  if (path.isAbsolute(normalized)) {
    return normalized;
  }
  return path.resolve(cwd, normalized);
}

function fileExists(filePath) {
  try {
    const resolved = resolvePath(filePath);
    return fs.existsSync(resolved) && fs.statSync(resolved).isFile();
  } catch {
    return false;
  }
}

function readFileSync(filePath) {
  const resolved = resolvePath(filePath);
  try {
    const content = fs.readFileSync(resolved, 'utf8');
    return {
      success: true,
      content,
      path: resolved
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.FILE_READ_ERROR,
        message: `无法读取文件: ${resolved}`,
        details: error.message,
        path: resolved
      }
    };
  }
}

function readFromStdin() {
  return new Promise((resolve, reject) => {
    let content = '';
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      content += chunk;
    });
    process.stdin.on('end', () => {
      resolve(content);
    });
    process.stdin.on('error', (error) => {
      reject(error);
    });
  });
}

function parseJson(content, filePath = 'stdin') {
  try {
    const data = JSON.parse(content);
    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.JSON_PARSE_ERROR,
        message: `JSON 解析失败: ${filePath}`,
        details: error.message,
        path: filePath,
        line: extractLineNumber(error.message)
      }
    };
  }
}

function extractLineNumber(errorMessage) {
  const match = errorMessage.match(/position (\d+)/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

async function loadLocaleFile(filePath) {
  if (filePath === '-' || !filePath) {
    const stdinContent = await readFromStdin();
    if (!stdinContent.trim()) {
      return {
        success: false,
        error: {
          type: ERROR_TYPES.FILE_READ_ERROR,
          message: '标准输入为空',
          path: 'stdin'
        }
      };
    }
    const parsed = parseJson(stdinContent, 'stdin');
    if (!parsed.success) {
      return parsed;
    }
    return {
      success: true,
      data: parsed.data,
      path: 'stdin',
      source: 'stdin'
    };
  }

  if (!fileExists(filePath)) {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.FILE_READ_ERROR,
        message: `文件不存在: ${filePath}`,
        path: resolvePath(filePath)
      }
    };
  }

  const readResult = readFileSync(filePath);
  if (!readResult.success) {
    return readResult;
  }

  const parsed = parseJson(readResult.content, readResult.path);
  if (!parsed.success) {
    return parsed;
  }

  return {
    success: true,
    data: parsed.data,
    path: readResult.path,
    source: 'file'
  };
}

function writeFileSync(filePath, content) {
  const resolved = resolvePath(filePath);
  const dir = path.dirname(resolved);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(resolved, content, 'utf8');
    return {
      success: true,
      path: resolved
    };
  } catch (error) {
    return {
      success: false,
      error: {
        type: ERROR_TYPES.FILE_READ_ERROR,
        message: `无法写入文件: ${resolved}`,
        details: error.message,
        path: resolved
      }
    };
  }
}

function getExitCodeForError(errorType) {
  const codeMap = {
    [ERROR_TYPES.FILE_READ_ERROR]: EXIT_CODES.FILE_NOT_FOUND,
    [ERROR_TYPES.JSON_PARSE_ERROR]: EXIT_CODES.INVALID_JSON,
    [ERROR_TYPES.MISSING_KEY]: EXIT_CODES.MISSING_KEYS,
    [ERROR_TYPES.EMPTY_VALUE]: EXIT_CODES.MISSING_KEYS,
    [ERROR_TYPES.PLACEHOLDER_MISMATCH]: EXIT_CODES.PLACEHOLDER_MISMATCH,
    [ERROR_TYPES.LENGTH_TOO_LONG]: EXIT_CODES.LENGTH_VIOLATION,
    [ERROR_TYPES.LENGTH_TOO_SHORT]: EXIT_CODES.LENGTH_VIOLATION,
    [ERROR_TYPES.REVIEW_STATUS_INVALID]: EXIT_CODES.REVIEW_STATUS_ERROR,
    [ERROR_TYPES.EXTRA_KEY]: EXIT_CODES.VALIDATION_ERROR
  };
  return codeMap[errorType] || EXIT_CODES.VALIDATION_ERROR;
}

module.exports = {
  normalizePath,
  resolvePath,
  fileExists,
  readFileSync,
  readFromStdin,
  parseJson,
  loadLocaleFile,
  writeFileSync,
  getExitCodeForError
};
