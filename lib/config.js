'use strict';

const { DEFAULT_CONFIG, OUTPUT_FORMATS } = require('./constants');

function cloneRegex(regex) {
  return new RegExp(regex.source, regex.flags);
}

function mergeConfig(cliOptions = {}, configFile = {}) {
  const merged = {
    ...DEFAULT_CONFIG,
    placeholderPattern: cloneRegex(DEFAULT_CONFIG.placeholderPattern),
    lengthCheck: { ...DEFAULT_CONFIG.lengthCheck },
    reviewStatus: { ...DEFAULT_CONFIG.reviewStatus }
  };

  if (configFile.placeholderPattern) {
    merged.placeholderPattern = new RegExp(configFile.placeholderPattern, 'g');
  }

  if (configFile.lengthCheck) {
    merged.lengthCheck = { ...merged.lengthCheck, ...configFile.lengthCheck };
  }

  if (configFile.reviewStatus) {
    merged.reviewStatus = { ...merged.reviewStatus, ...configFile.reviewStatus };
  }

  if (cliOptions.format && Object.values(OUTPUT_FORMATS).includes(cliOptions.format)) {
    merged.outputFormat = cliOptions.format;
  }

  if (cliOptions.strict !== undefined) {
    merged.strictMode = cliOptions.strict;
  }

  if (cliOptions.failOnWarnings !== undefined) {
    merged.failOnWarnings = cliOptions.failOnWarnings;
  }

  if (cliOptions.maxLength !== undefined) {
    merged.lengthCheck.enabled = true;
    merged.lengthCheck.maxLength = cliOptions.maxLength;
  }

  if (cliOptions.minLength !== undefined) {
    merged.lengthCheck.enabled = true;
    merged.lengthCheck.minLength = cliOptions.minLength;
  }

  if (cliOptions.requireReview) {
    merged.reviewStatus.enabled = true;
  }

  if (cliOptions.placeholderPattern) {
    try {
      merged.placeholderPattern = new RegExp(cliOptions.placeholderPattern, 'g');
    } catch (error) {
      throw new Error(`无效的占位符正则表达式: ${cliOptions.placeholderPattern}, ${error.message}`);
    }
  }

  return merged;
}

function validateConfig(config) {
  const errors = [];

  if (config.lengthCheck.enabled) {
    if (config.lengthCheck.maxLength !== null && config.lengthCheck.maxLength < 0) {
      errors.push('maxLength 不能为负数');
    }
    if (config.lengthCheck.minLength < 0) {
      errors.push('minLength 不能为负数');
    }
    if (config.lengthCheck.maxLength !== null &&
        config.lengthCheck.minLength > config.lengthCheck.maxLength) {
      errors.push('minLength 不能大于 maxLength');
    }
  }

  if (config.placeholderPattern && !(config.placeholderPattern instanceof RegExp)) {
    errors.push('placeholderPattern 必须是 RegExp 类型');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  mergeConfig,
  validateConfig
};
