'use strict';

const fs = require('fs');
const path = require('path');

const { RESULT_STATUS, EXIT_CODES } = require('../utils/constants');
const { collectMarkdownFiles } = require('./scanner');
const { LinkChecker, parsedFileCache } = require('./checker');
const { IgnoreEngine } = require('./ignore');
const { parseMarkdownFile } = require('./parser');

async function runScan(config, logger) {
  const startTime = Date.now();
  const rootDir = path.resolve(config.root);
  parsedFileCache.clear();

  if (!fs.existsSync(rootDir)) {
    const err = new Error(`根目录不存在: ${rootDir}`);
    err.exitCode = EXIT_CODES.INVALID_ARGUMENTS;
    throw err;
  }

  logger.info('开始扫描', {
    root: rootDir,
    recursive: config.recursive,
    extensions: config.fileExtensions,
    checkExternal: config.checkExternal,
    checkAnchors: config.checkAnchors,
    checkImages: config.checkImages,
    timeout: config.timeout,
    concurrency: config.concurrency
  });

  const ignoreEngine = new IgnoreEngine({
    ignore: config.ignore || [],
    ignorePatterns: config.ignorePatterns || [],
    ignoreFiles: config.ignoreFiles || [],
    root: rootDir
  });

  const markdownFiles = collectMarkdownFiles(rootDir, {
    recursive: config.recursive,
    fileExtensions: config.fileExtensions
  }, ignoreEngine);

  logger.info(`发现 ${markdownFiles.length} 个 Markdown 文件`);

  if (markdownFiles.length === 0) {
    return buildEmptyResult(rootDir, startTime);
  }

  const fileResults = [];
  const allLinks = [];

  for (const file of markdownFiles) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf-8');
    } catch (e) {
      fileResults.push({
        file: path.relative(rootDir, file),
        absPath: file,
        error: `无法读取文件: ${e.message}`,
        links: [],
        linkCount: 0
      });
      continue;
    }

    const parsed = parseMarkdownFile(content, file);
    fileResults.push({
      file: path.relative(rootDir, file),
      absPath: file,
      links: [],
      linkCount: parsed.links.length
    });

    for (const link of parsed.links) {
      allLinks.push({ link, fileResult: fileResults[fileResults.length - 1] });
    }
  }

  logger.debug(`共提取到 ${allLinks.length} 个链接引用`);

  const checker = new LinkChecker({ config, ignoreEngine, logger });
  const results = await runWithConcurrency(
    allLinks,
    config.concurrency,
    async ({ link }) => checker.checkLink(link, rootDir)
  );

  const brokenByFile = new Map();
  const finalLinkResults = [];

  for (let i = 0; i < allLinks.length; i++) {
    const linkResult = results[i];
    const { fileResult } = allLinks[i];
    fileResult.links.push(linkResult);
    finalLinkResults.push(linkResult);

    if (linkResult.status === RESULT_STATUS.BROKEN) {
      if (!brokenByFile.has(fileResult.absPath)) brokenByFile.set(fileResult.absPath, []);
      brokenByFile.get(fileResult.absPath).push(linkResult);
    }
  }

  const summary = summarizeResults(finalLinkResults, markdownFiles.length, fileResults, startTime);

  const result = {
    root: rootDir,
    config: {
      checkExternal: config.checkExternal,
      checkAnchors: config.checkAnchors,
      checkImages: config.checkImages,
      timeout: config.timeout,
      recursive: config.recursive
    },
    files: fileResults,
    summary,
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: summary.durationMs
  };

  if (summary.brokenCount > 0) {
    logger.warn(`发现 ${summary.brokenCount} 个坏链`);
  } else {
    logger.info('扫描完成，未发现坏链');
  }

  return result;
}

function summarizeResults(links, fileCount, fileResults, startTime) {
  const stats = {
    total: links.length,
    byType: {},
    byStatus: {}
  };

  for (const link of links) {
    stats.byType[link.type] = (stats.byType[link.type] || 0) + 1;
    stats.byStatus[link.status] = (stats.byStatus[link.status] || 0) + 1;
  }

  const brokenCount = stats.byStatus[RESULT_STATUS.BROKEN] || 0;
  const warningCount = stats.byStatus[RESULT_STATUS.WARNING] || 0;
  const ignoredCount = stats.byStatus[RESULT_STATUS.IGNORED] || 0;
  const skippedCount = stats.byStatus[RESULT_STATUS.SKIPPED] || 0;
  const okCount = stats.byStatus[RESULT_STATUS.OK] || 0;

  return {
    fileCount,
    scannedFiles: fileResults.filter(f => !f.error).length,
    errorFiles: fileResults.filter(f => f.error).length,
    ...stats,
    okCount,
    brokenCount,
    warningCount,
    ignoredCount,
    skippedCount,
    checkedCount: okCount + brokenCount + warningCount,
    durationMs: Date.now() - startTime
  };
}

function buildEmptyResult(rootDir, startTime) {
  return {
    root: rootDir,
    config: {},
    files: [],
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    summary: {
      fileCount: 0,
      scannedFiles: 0,
      errorFiles: 0,
      total: 0,
      byType: {},
      byStatus: {},
      okCount: 0,
      brokenCount: 0,
      warningCount: 0,
      ignoredCount: 0,
      skippedCount: 0,
      checkedCount: 0,
      durationMs: Date.now() - startTime
    }
  };
}

async function runWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIdx = 0;

  async function worker() {
    while (nextIdx < items.length) {
      const idx = nextIdx++;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        results[idx] = {
          status: RESULT_STATUS.BROKEN,
          raw: items[idx]?.link?.raw || '',
          type: items[idx]?.link?.type || 'unknown',
          sourceFile: items[idx]?.link?.sourceFile || '',
          line: items[idx]?.link?.line || 0,
          text: '',
          details: { reason: `检查时发生异常: ${e.message}` }
        };
      }
    }
  }

  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

module.exports = {
  runScan,
  runWithConcurrency
};
