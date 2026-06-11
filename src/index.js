'use strict';

const { EXIT_CODES, ERROR_TYPES } = require('../lib/constants');
const { mergeConfig, validateConfig } = require('../lib/config');
const { loadLocaleFile, getExitCodeForError } = require('../lib/file-utils');
const { checkKeyAlignment, getMissingKeys } = require('../lib/key-checker');
const { checkPlaceholders } = require('../lib/placeholder-checker');
const { checkLength, checkReviewStatus } = require('../lib/value-checker');
const { generateReport, generateSummary, writeReport } = require('../lib/report-generator');

class I18nDiffChecker {
  constructor(cliOptions = {}, configFile = {}) {
    this.config = mergeConfig(cliOptions, configFile);
    this.cliOptions = cliOptions;
    this._validateConfig();
  }

  _validateConfig() {
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new Error(`配置无效: ${validation.errors.join(', ')}`);
    }
  }

  async check(basePath, localePath, options = {}) {
    const startTime = process.hrtime();

    const baseResult = typeof basePath === 'object' && basePath.data
      ? { success: true, data: basePath.data, path: basePath.path || 'memory', source: basePath.source || 'memory' }
      : await loadLocaleFile(basePath);
    if (!baseResult.success) {
      return this._createErrorResult(baseResult.error, startTime);
    }

    const localeResult = typeof localePath === 'object' && localePath.data
      ? { success: true, data: localePath.data, path: localePath.path || 'memory', source: localePath.source || 'memory' }
      : await loadLocaleFile(localePath);
    if (!localeResult.success) {
      return this._createErrorResult(localeResult.error, startTime);
    }

    const checkOptions = {
      basePath: baseResult.path,
      localePath: localeResult.path,
      strictMode: this.config.strictMode
    };

    const keyCheck = checkKeyAlignment(baseResult.data, localeResult.data, checkOptions);
    const placeholderCheck = checkPlaceholders(baseResult.data, localeResult.data, this.config, checkOptions);
    const lengthCheck = checkLength(baseResult.data, localeResult.data, this.config, checkOptions);
    const reviewCheck = checkReviewStatus(localeResult.data, this.config, checkOptions);

    const checkResults = {
      keyCheck,
      placeholderCheck,
      lengthCheck,
      reviewCheck
    };

    const summary = generateSummary(checkResults);
    const elapsed = process.hrtime(startTime);
    const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1e6;

    let missingKeysData = null;
    if (options.exportMissing || this.cliOptions.missing) {
      missingKeysData = getMissingKeys(baseResult.data, localeResult.data);
    }

    const reportOptions = {
      basePath: baseResult.path,
      localePath: localeResult.path,
      baseLocale: this.cliOptions.baseLocale || this.config.baseLocale,
      targetLocale: this.cliOptions.targetLocale,
      missingKeysData
    };

    const exitCode = this._calculateExitCode(checkResults, summary);

    return {
      success: exitCode === EXIT_CODES.SUCCESS,
      exitCode,
      summary,
      results: checkResults,
      performance: {
        durationMs: elapsedMs,
        startTime: new Date(startTime[0] * 1000).toISOString()
      },
      metadata: {
        basePath: baseResult.path,
        localePath: localeResult.path,
        baseSource: baseResult.source,
        localeSource: localeResult.source
      },
      missingKeys: missingKeysData,
      getReport: (format = this.config.outputFormat) => {
        return generateReport(checkResults, format, reportOptions);
      },
      writeReport: (filePath, format) => {
        const report = generateReport(checkResults, format || this.config.outputFormat, reportOptions);
        return writeReport(report, filePath);
      }
    };
  }

  _createErrorResult(error, startTime) {
    const elapsed = process.hrtime(startTime);
    const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1e6;
    const exitCode = getExitCodeForError(error.type);

    return {
      success: false,
      exitCode,
      error,
      summary: {
        timestamp: new Date().toISOString(),
        totalErrors: 1,
        totalWarnings: 0,
        errorCounts: { [error.type]: 1 },
        warningCounts: {},
        stats: null
      },
      performance: {
        durationMs: elapsedMs
      },
      results: null,
      metadata: null,
      missingKeys: null,
      getReport: () => {
        return this._generateErrorReport(error);
      },
      writeReport: (filePath) => {
        return writeReport(this._generateErrorReport(error), filePath);
      }
    };
  }

  _generateErrorReport(error) {
    return JSON.stringify({
      schemaVersion: '1.0',
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: 1,
        totalWarnings: 0,
        errorCounts: { [error.type]: 1 },
        passed: false
      },
      errors: [error],
      warnings: []
    }, null, 2);
  }

  _calculateExitCode(checkResults, summary) {
    if (summary.totalErrors > 0) {
      const errorTypes = Object.keys(summary.errorCounts);
      let highestPriorityCode = EXIT_CODES.SUCCESS;
      const priorityOrder = [
        EXIT_CODES.FILE_NOT_FOUND,
        EXIT_CODES.INVALID_JSON,
        EXIT_CODES.PLACEHOLDER_MISMATCH,
        EXIT_CODES.LENGTH_VIOLATION,
        EXIT_CODES.REVIEW_STATUS_ERROR,
        EXIT_CODES.MISSING_KEYS,
        EXIT_CODES.VALIDATION_ERROR
      ];
      for (const type of errorTypes) {
        const code = getExitCodeForError(type);
        const codePriority = priorityOrder.indexOf(code);
        const currentPriority = priorityOrder.indexOf(highestPriorityCode);
        if (codePriority !== -1 && codePriority > currentPriority) {
          highestPriorityCode = code;
        }
      }
      if (highestPriorityCode !== EXIT_CODES.SUCCESS) {
        return highestPriorityCode;
      }
      return EXIT_CODES.VALIDATION_ERROR;
    }

    if (this.config.failOnWarnings && summary.totalWarnings > 0) {
      return EXIT_CODES.VALIDATION_ERROR;
    }

    return EXIT_CODES.SUCCESS;
  }
}

async function checkI18nDiff(basePath, localePath, cliOptions = {}, configFile = {}) {
  const checker = new I18nDiffChecker(cliOptions, configFile);
  return checker.check(basePath, localePath, cliOptions);
}

module.exports = {
  I18nDiffChecker,
  checkI18nDiff,
  EXIT_CODES,
  ERROR_TYPES
};
