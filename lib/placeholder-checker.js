'use strict';

const { ERROR_TYPES, SEVERITY } = require('./constants');
const { getValueByKey, getAllKeys } = require('./key-checker');

function extractPlaceholders(text, pattern) {
  if (typeof text !== 'string') return [];
  const placeholders = [];
  let match;
  let regex;
  if (pattern instanceof RegExp) {
    regex = new RegExp(pattern.source, pattern.flags);
  } else {
    regex = new RegExp(pattern, 'g');
  }
  while ((match = regex.exec(text)) !== null) {
    placeholders.push(match[1] || match[0]);
    if (match.index === regex.lastIndex) {
      regex.lastIndex++;
    }
  }
  return [...new Set(placeholders)];
}

function comparePlaceholders(basePlaceholders, localePlaceholders) {
  const baseSet = new Set(basePlaceholders);
  const localeSet = new Set(localePlaceholders);
  const missing = basePlaceholders.filter(p => !localeSet.has(p));
  const extra = localePlaceholders.filter(p => !baseSet.has(p));
  return { missing, extra, match: missing.length === 0 && extra.length === 0 };
}

function checkPlaceholders(baseData, localeData, config, options = {}) {
  const errors = [];
  const warnings = [];
  const baseKeys = getAllKeys(baseData);
  const localeKeySet = new Set(getAllKeys(localeData));
  const alignedKeys = baseKeys.filter(key => localeKeySet.has(key));
  const pattern = config.placeholderPattern;

  for (const key of alignedKeys) {
    const baseValue = getValueByKey(baseData, key);
    const localeValue = getValueByKey(localeData, key);

    if (typeof baseValue !== 'string' || typeof localeValue !== 'string') {
      continue;
    }

    if (!baseValue.trim() || !localeValue.trim()) {
      continue;
    }

    const basePlaceholders = extractPlaceholders(baseValue, pattern);
    const localePlaceholders = extractPlaceholders(localeValue, pattern);

    if (basePlaceholders.length === 0 && localePlaceholders.length === 0) {
      continue;
    }

    const comparison = comparePlaceholders(basePlaceholders, localePlaceholders);

    if (!comparison.match) {
      errors.push({
        type: ERROR_TYPES.PLACEHOLDER_MISMATCH,
        severity: SEVERITY.ERROR,
        key,
        message: `占位符不匹配: ${key}`,
        baseValue,
        localeValue,
        details: {
          basePlaceholders,
          localePlaceholders,
          missingPlaceholders: comparison.missing,
          extraPlaceholders: comparison.extra,
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
      totalChecked: alignedKeys.length,
      placeholderErrors: errors.length,
      withPlaceholders: baseKeys.filter(k =>
        extractPlaceholders(getValueByKey(baseData, k), pattern).length > 0
      ).length
    }
  };
}

module.exports = {
  extractPlaceholders,
  comparePlaceholders,
  checkPlaceholders
};
