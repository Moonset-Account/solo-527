'use strict';

const { ERROR_TYPES, SEVERITY } = require('./constants');
const { getValueByKey, getAllKeys } = require('./key-checker');

function checkLength(baseData, localeData, config, options = {}) {
  const errors = [];
  const warnings = [];
  const { maxLength, minLength, enabled } = config.lengthCheck;

  if (!enabled) {
    return { errors, warnings, stats: { totalChecked: 0, lengthErrors: 0 } };
  }

  const baseKeys = getAllKeys(baseData);
  const localeKeySet = new Set(getAllKeys(localeData));
  const alignedKeys = baseKeys.filter(key => localeKeySet.has(key));
  let checkedCount = 0;

  for (const key of alignedKeys) {
    const baseValue = getValueByKey(baseData, key);
    const localeValue = getValueByKey(localeData, key);

    if (typeof localeValue !== 'string' || !localeValue.trim()) {
      continue;
    }

    checkedCount++;
    const length = localeValue.length;

    if (maxLength !== null && length > maxLength) {
      errors.push({
        type: ERROR_TYPES.LENGTH_TOO_LONG,
        severity: SEVERITY.ERROR,
        key,
        message: `长度超过限制: ${key} (${length}/${maxLength})`,
        baseValue,
        localeValue,
        details: {
          actualLength: length,
          maxLength,
          basePath: options.basePath,
          localePath: options.localePath
        }
      });
    }

    if (minLength > 0 && length < minLength) {
      errors.push({
        type: ERROR_TYPES.LENGTH_TOO_SHORT,
        severity: SEVERITY.ERROR,
        key,
        message: `长度不足: ${key} (${length}/${minLength})`,
        baseValue,
        localeValue,
        details: {
          actualLength: length,
          minLength,
          basePath: options.basePath,
          localePath: options.localePath
        }
      });
    }
  }

  return {
    errors,
    warnings,
    stats: {
      totalChecked: checkedCount,
      lengthErrors: errors.length,
      maxLength,
      minLength
    }
  };
}

function checkReviewStatus(localeData, config, options = {}) {
  const errors = [];
  const warnings = [];
  const { enabled, requiredStatus } = config.reviewStatus;

  if (!enabled) {
    return { errors, warnings, stats: { totalChecked: 0, statusErrors: 0 } };
  }

  const localeKeys = getAllKeys(localeData);
  const statusKeySuffixes = ['_status', '.status', '_review', '.review'];
  let checkedCount = 0;

  for (const key of localeKeys) {
    const value = getValueByKey(localeData, key);

    const isStatusKey = statusKeySuffixes.some(suffix =>
      key.endsWith(suffix) || key.includes(suffix)
    );

    if (isStatusKey) {
      continue;
    }

    const statusKeyCandidates = statusKeySuffixes.map(suffix => key + suffix);
    let statusValue = null;

    for (const statusKey of statusKeyCandidates) {
      statusValue = getValueByKey(localeData, statusKey);
      if (statusValue !== undefined) break;
    }

    if (statusValue === undefined && typeof value === 'object' && value !== null) {
      statusValue = value.status || value.reviewStatus;
    }

    if (statusValue !== undefined) {
      checkedCount++;
      const statusStr = String(statusValue).toLowerCase();
      if (!requiredStatus.map(s => s.toLowerCase()).includes(statusStr)) {
        errors.push({
          type: ERROR_TYPES.REVIEW_STATUS_INVALID,
          severity: SEVERITY.ERROR,
          key,
          message: `审核状态无效: ${key} (${statusValue})`,
          baseValue: undefined,
          localeValue: value,
          details: {
            actualStatus: statusValue,
            requiredStatus,
            basePath: options.basePath,
            localePath: options.localePath
          }
        });
      }
    }
  }

  return {
    errors,
    warnings,
    stats: {
      totalChecked: checkedCount,
      statusErrors: errors.length,
      requiredStatus
    }
  };
}

module.exports = {
  checkLength,
  checkReviewStatus
};
