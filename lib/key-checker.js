'use strict';

const { ERROR_TYPES, SEVERITY, isStatusKey, collectContentKeys, STATUS_KEY_SUFFIXES, NESTED_STATUS_FIELDS } = require('./constants');

function flattenObject(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, fullKey));
      } else {
        result[fullKey] = value;
      }
    }
  }
  return result;
}

function getAllKeys(obj) {
  return Object.keys(flattenObject(obj));
}

function getValueByKey(obj, key) {
  const parts = key.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && current.hasOwnProperty(part)) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function checkKeyAlignment(baseData, localeData, options = {}) {
  const errors = [];
  const warnings = [];

  const { baseKeys, localeKeys, contentKeys } = collectContentKeys(baseData, localeData, getAllKeys);
  const baseKeySet = new Set(baseKeys);
  const localeKeySet = new Set(localeKeys);

  const missingKeys = baseKeys.filter(key => !localeKeySet.has(key));
  const extraKeys = localeKeys.filter(key => {
    if (!baseKeySet.has(key)) {
      return !isStatusKey(key, contentKeys);
    }
    return false;
  });

  const filteredLocaleKeys = localeKeys.filter(key => !isStatusKey(key, contentKeys));
  const filteredTotalLocaleKeys = filteredLocaleKeys.length;

  for (const key of missingKeys) {
    const baseValue = getValueByKey(baseData, key);
    errors.push({
      type: ERROR_TYPES.MISSING_KEY,
      severity: SEVERITY.ERROR,
      key,
      message: `缺失键: ${key}`,
      baseValue,
      localeValue: undefined,
      details: {
        basePath: options.basePath,
        localePath: options.localePath
      }
    });
  }

  for (const key of extraKeys) {
    const localeValue = getValueByKey(localeData, key);
    (options.strictMode ? errors : warnings).push({
      type: ERROR_TYPES.EXTRA_KEY,
      severity: options.strictMode ? SEVERITY.ERROR : SEVERITY.WARNING,
      key,
      message: `多余键: ${key}`,
      baseValue: undefined,
      localeValue,
      details: {
        basePath: options.basePath,
        localePath: options.localePath
      }
    });
  }

  const alignedKeys = baseKeys.filter(key => localeKeySet.has(key));

  for (const key of alignedKeys) {
    const baseValue = getValueByKey(baseData, key);
    const localeValue = getValueByKey(localeData, key);

    if (baseValue === null || baseValue === undefined ||
        (typeof baseValue === 'string' && baseValue.trim() === '')) {
      continue;
    }

    if (localeValue === null || localeValue === undefined ||
        (typeof localeValue === 'string' && localeValue.trim() === '')) {
      errors.push({
        type: ERROR_TYPES.EMPTY_VALUE,
        severity: SEVERITY.ERROR,
        key,
        message: `空值: ${key}`,
        baseValue,
        localeValue,
        details: {
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
      totalBaseKeys: baseKeys.length,
      totalLocaleKeys: localeKeys.length,
      totalLocaleContentKeys: filteredTotalLocaleKeys,
      statusKeys: localeKeys.length - filteredTotalLocaleKeys,
      missingKeys: missingKeys.length,
      extraKeys: extraKeys.length,
      alignedKeys: alignedKeys.length,
      emptyValues: errors.filter(e => e.type === ERROR_TYPES.EMPTY_VALUE).length
    }
  };
}

function getMissingKeys(baseData, localeData) {
  const result = {};
  const baseKeys = getAllKeys(baseData);
  const localeKeySet = new Set(getAllKeys(localeData));
  const missingKeys = baseKeys.filter(key => !localeKeySet.has(key));

  for (const key of missingKeys) {
    const parts = key.split('.');
    let target = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) {
        target[parts[i]] = {};
      }
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = getValueByKey(baseData, key);
  }

  return result;
}

module.exports = {
  flattenObject,
  getAllKeys,
  getValueByKey,
  checkKeyAlignment,
  getMissingKeys
};
