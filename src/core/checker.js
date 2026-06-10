'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const { LINK_TYPES, RESULT_STATUS } = require('../utils/constants');
const { parseMarkdownFile, splitLinkTarget } = require('./parser');

const parsedFileCache = new Map();

function getParsedMarkdown(filePath) {
  const abs = path.resolve(filePath);
  if (parsedFileCache.has(abs)) return parsedFileCache.get(abs);
  try {
    const content = fs.readFileSync(abs, 'utf-8');
    const result = parseMarkdownFile(content, abs);
    parsedFileCache.set(abs, result);
    return result;
  } catch (e) {
    return null;
  }
}

function resolveInternalLink(rawLink, sourceFile, rootDir) {
  const { pathPart, anchor } = splitLinkTarget(rawLink);
  const srcDir = path.dirname(path.resolve(sourceFile));

  let resolvedAbs;
  if (!pathPart) {
    resolvedAbs = path.resolve(sourceFile);
  } else if (path.isAbsolute(pathPart)) {
    resolvedAbs = path.join(rootDir, pathPart.replace(/^\/+/, ''));
  } else {
    resolvedAbs = path.resolve(srcDir, pathPart);
  }

  let isDir = false;
  try {
    isDir = fs.existsSync(resolvedAbs) && fs.statSync(resolvedAbs).isDirectory();
  } catch { isDir = false; }

  if (isDir) {
    const indexMd = path.join(resolvedAbs, 'README.md');
    const indexReadme = path.join(resolvedAbs, 'readme.md');
    const indexMarkdown = path.join(resolvedAbs, 'index.md');
    if (fs.existsSync(indexMd)) resolvedAbs = indexMd;
    else if (fs.existsSync(indexReadme)) resolvedAbs = indexReadme;
    else if (fs.existsSync(indexMarkdown)) resolvedAbs = indexMarkdown;
  }

  let targetFile = null;
  if (fs.existsSync(resolvedAbs)) {
    targetFile = resolvedAbs;
  } else {
    const ext = path.extname(resolvedAbs);
    if (!ext) {
      const candidates = [resolvedAbs + '.md', resolvedAbs + '.markdown', resolvedAbs + '.html'];
      for (const c of candidates) {
        if (fs.existsSync(c)) { targetFile = c; break; }
      }
    }
  }

  return { targetFile, anchor, pathPart };
}

function checkAnchor(targetFile, anchor) {
  if (!anchor) return { ok: true };
  const parsed = getParsedMarkdown(targetFile);
  if (!parsed) {
    if (/\.(html?|htm)$/i.test(targetFile)) return { ok: true, warning: '无法解析 HTML 文件锚点' };
    return { ok: false, reason: '目标文件不是有效的 Markdown 或无法读取' };
  }
  if (parsed.anchors.has(anchor)) return { ok: true };
  const similar = [...parsed.anchors].filter(a => {
    const d = Math.abs(a.length - anchor.length);
    if (d > 3) return false;
    let matches = 0;
    for (let i = 0; i < Math.min(a.length, anchor.length); i++) {
      if (a[i] === anchor[i]) matches++;
    }
    return matches / Math.max(a.length, anchor.length) > 0.7;
  });
  return { ok: false, reason: `锚点不存在: #${anchor}`, similar: similar.slice(0, 5) };
}

function fetchUrl(urlStr, timeoutMs) {
  return new Promise(resolve => {
    let url;
    try {
      if (urlStr.startsWith('//')) urlStr = 'https:' + urlStr;
      url = new URL(urlStr);
    } catch (e) {
      resolve({ ok: false, reason: `无效的 URL: ${urlStr}`, status: null });
      return;
    }

    const lib = url.protocol === 'https:' ? https : http;
    const options = {
      method: 'HEAD',
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'md-link-checker/1.0 (+https://example.com)',
        'Accept': '*/*'
      },
      rejectUnauthorized: false
    };

    let finished = false;
    const done = (result) => {
      if (finished) return;
      finished = true;
      resolve(result);
    };

    try {
      const req = lib.request(url, options, res => {
        const status = res.statusCode;
        res.resume();
        if (status >= 200 && status < 400) {
          done({ ok: true, status });
        } else if (status === 405 || status === 501 || status === 403) {
          const getReq = lib.request(url, { ...options, method: 'GET' }, getRes => {
            getRes.resume();
            const s = getRes.statusCode;
            if (s >= 200 && s < 400) done({ ok: true, status: s });
            else done({ ok: false, status: s, reason: `HTTP ${s}` });
          });
          getReq.on('error', () => done({ ok: true, status, warning: 'HEAD 受限，GET 失败，跳过' }));
          getReq.on('timeout', () => { getReq.destroy(); done({ ok: true, status, warning: 'HEAD 受限，GET 超时，跳过' }); });
          getReq.end();
        } else {
          done({ ok: false, status, reason: `HTTP ${status}` });
        }
      });

      req.on('timeout', () => { req.destroy(new Error('ETIMEDOUT')); });
      req.on('error', err => {
        if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
          done({ ok: false, reason: `网络超时 (${timeoutMs}ms)`, status: null });
        } else if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
          done({ ok: false, reason: `域名解析失败: ${err.code}`, status: null });
        } else if (err.code === 'ECONNREFUSED') {
          done({ ok: false, reason: '连接被拒绝', status: null });
        } else {
          done({ ok: false, reason: `网络错误: ${err.message}`, status: null });
        }
      });
      req.end();

      setTimeout(() => {
        if (!finished) { req.destroy(new Error('ETIMEDOUT')); }
      }, timeoutMs + 1000);
    } catch (e) {
      done({ ok: false, reason: `请求错误: ${e.message}`, status: null });
    }
  });
}

class LinkChecker {
  constructor({ config, ignoreEngine, logger }) {
    this.config = config;
    this.ignoreEngine = ignoreEngine;
    this.logger = logger;
    this.urlCache = new Map();
  }

  async checkLink(linkInfo, rootDir) {
    const result = {
      raw: linkInfo.raw,
      type: linkInfo.type,
      sourceFile: linkInfo.sourceFile,
      line: linkInfo.line,
      text: linkInfo.text || linkInfo.alt || '',
      status: RESULT_STATUS.OK,
      details: {}
    };

    if (this.ignoreEngine.isLinkIgnored(linkInfo.raw, linkInfo.sourceFile)) {
      result.status = RESULT_STATUS.IGNORED;
      result.details.reason = '匹配忽略规则';
      return result;
    }

    if (linkInfo.type === LINK_TYPES.MAILTO) {
      result.status = RESULT_STATUS.SKIPPED;
      result.details.reason = 'mailto 链接无需校验';
      return result;
    }

    if (linkInfo.type === LINK_TYPES.UNKNOWN) {
      result.status = RESULT_STATUS.SKIPPED;
      result.details.reason = '无法识别的链接类型';
      return result;
    }

    switch (linkInfo.type) {
      case LINK_TYPES.EXTERNAL_URL:
        return this._checkExternal(linkInfo, result);
      case LINK_TYPES.IMAGE:
        return this._checkImage(linkInfo, result, rootDir);
      case LINK_TYPES.INTERNAL_FILE:
      case LINK_TYPES.INTERNAL_ANCHOR:
      default:
        return this._checkInternal(linkInfo, result, rootDir);
    }
  }

  async _checkExternal(linkInfo, result) {
    if (!this.config.checkExternal) {
      result.status = RESULT_STATUS.SKIPPED;
      result.details.reason = '已禁用外部链接检查';
      return result;
    }

    const cacheKey = linkInfo.raw;
    if (this.urlCache.has(cacheKey)) {
      const cached = this.urlCache.get(cacheKey);
      if (cached.ok) {
        result.details.status = cached.status;
        return result;
      } else {
        result.status = RESULT_STATUS.BROKEN;
        result.details.reason = cached.reason;
        result.details.status = cached.status;
        return result;
      }
    }

    this.logger.debug('检查外部链接', { url: linkInfo.raw });
    const httpResult = await fetchUrl(linkInfo.raw, this.config.timeout);
    this.urlCache.set(cacheKey, httpResult);

    if (httpResult.ok) {
      result.details.status = httpResult.status;
      if (httpResult.warning) {
        result.status = RESULT_STATUS.WARNING;
        result.details.warning = httpResult.warning;
      }
    } else {
      result.status = RESULT_STATUS.BROKEN;
      result.details.reason = httpResult.reason;
      result.details.status = httpResult.status;
    }
    return result;
  }

  _checkImage(linkInfo, result, rootDir) {
    if (!this.config.checkImages) {
      result.status = RESULT_STATUS.SKIPPED;
      result.details.reason = '已禁用图片检查';
      return result;
    }
    const { pathPart } = splitLinkTarget(linkInfo.raw);
    if (!pathPart) {
      result.status = RESULT_STATUS.BROKEN;
      result.details.reason = '图片路径为空';
      return result;
    }
    if (/^(https?:)?\/\//i.test(pathPart)) {
      return this._checkExternal(linkInfo, result);
    }
    const srcDir = path.dirname(path.resolve(linkInfo.sourceFile));
    let abs = path.isAbsolute(pathPart)
      ? path.join(rootDir, pathPart.replace(/^\/+/, ''))
      : path.resolve(srcDir, pathPart);

    if (fs.existsSync(abs)) {
      try {
        const stat = fs.statSync(abs);
        if (stat.size === 0) {
          result.status = RESULT_STATUS.WARNING;
          result.details.reason = '图片文件为空';
        }
      } catch {}
    } else {
      result.status = RESULT_STATUS.BROKEN;
      result.details.reason = `图片文件不存在: ${pathPart}`;
      result.details.resolvedPath = abs;
    }
    return result;
  }

  _checkInternal(linkInfo, result, rootDir) {
    const { targetFile, anchor, pathPart } = resolveInternalLink(linkInfo.raw, linkInfo.sourceFile, rootDir);

    if (!targetFile && pathPart) {
      result.status = RESULT_STATUS.BROKEN;
      result.details.reason = `目标文件不存在: ${pathPart || '(空)'}`;
      const srcDir = path.dirname(path.resolve(linkInfo.sourceFile));
      result.details.resolvedPath = path.isAbsolute(pathPart)
        ? path.join(rootDir, pathPart.replace(/^\/+/, ''))
        : path.resolve(srcDir, pathPart);
      return result;
    }

    if (anchor && !this.config.checkAnchors) {
      result.details.note = '包含锚点，但已禁用锚点检查';
      return result;
    }

    if (anchor) {
      const fileToCheck = targetFile || path.resolve(linkInfo.sourceFile);
      const anchorCheck = checkAnchor(fileToCheck, anchor);
      if (anchorCheck.ok) {
        if (anchorCheck.warning) {
          result.status = RESULT_STATUS.WARNING;
          result.details.warning = anchorCheck.warning;
        }
      } else {
        result.status = RESULT_STATUS.BROKEN;
        result.details.reason = anchorCheck.reason;
        result.details.targetFile = targetFile;
        if (anchorCheck.similar && anchorCheck.similar.length) {
          result.details.suggestions = anchorCheck.similar;
        }
      }
    }

    return result;
  }
}

module.exports = {
  LinkChecker,
  resolveInternalLink,
  checkAnchor,
  fetchUrl,
  getParsedMarkdown,
  parsedFileCache
};
