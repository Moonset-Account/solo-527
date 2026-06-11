'use strict';

const EXIT_CODES = {
  SUCCESS: 0,
  VALIDATION_ERROR: 1,
  FILE_NOT_FOUND: 2,
  INVALID_JSON: 3,
  MISSING_KEYS: 4,
  PLACEHOLDER_MISMATCH: 5,
  LENGTH_VIOLATION: 6,
  REVIEW_STATUS_ERROR: 7,
  PERMISSION_ERROR: 8,
  UNKNOWN_ERROR: 99
};

const ERROR_TYPES = {
  MISSING_KEY: 'missing_key',
  EXTRA_KEY: 'extra_key',
  PLACEHOLDER_MISMATCH: 'placeholder_mismatch',
  LENGTH_TOO_LONG: 'length_too_long',
  LENGTH_TOO_SHORT: 'length_too_short',
  REVIEW_STATUS_INVALID: 'review_status_invalid',
  EMPTY_VALUE: 'empty_value',
  FILE_READ_ERROR: 'file_read_error',
  JSON_PARSE_ERROR: 'json_parse_error'
};

const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

const OUTPUT_FORMATS = {
  TEXT: 'text',
  JSON: 'json',
  CSV: 'csv'
};

const STATUS_KEY_SUFFIXES = ['_status', '.status', '_review', '.review'];
const NESTED_STATUS_FIELDS = ['status', 'reviewStatus'];

function isStatusKey(key, contentKeys) {
  if (typeof key !== 'string') return false;

  for (const suffix of STATUS_KEY_SUFFIXES) {
    if (key.endsWith(suffix)) {
      const contentKey = key.slice(0, -suffix.length);
      if (contentKeys) {
        if (contentKeys.has(contentKey)) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  for (const field of NESTED_STATUS_FIELDS) {
    const dotField = '.' + field;
    if (key.endsWith(dotField)) {
      const contentKey = key.slice(0, -dotField.length);
      if (contentKeys) {
        if (contentKeys.has(contentKey)) {
          return true;
        }
      } else {
        return true;
      }
    }
  }

  return false;
}

function getContentKeyForStatusKey(statusKey) {
  if (typeof statusKey !== 'string') return statusKey;

  for (const suffix of STATUS_KEY_SUFFIXES) {
    if (statusKey.endsWith(suffix)) {
      return statusKey.slice(0, -suffix.length);
    }
  }

  for (const field of NESTED_STATUS_FIELDS) {
    const dotField = '.' + field;
    if (statusKey.endsWith(dotField)) {
      return statusKey.slice(0, -dotField.length);
    }
  }

  return statusKey;
}

function collectContentKeys(baseData, localeData, getAllKeysFn) {
  const baseKeys = getAllKeysFn(baseData);
  const localeKeys = getAllKeysFn(localeData);
  const contentKeys = new Set();

  for (const key of baseKeys) {
    let isStateKey = false;
    for (const suffix of STATUS_KEY_SUFFIXES) {
      if (key.endsWith(suffix)) { isStateKey = true; break; }
    }
    if (!isStateKey) contentKeys.add(key);
  }

  const localeContentKeys = [];
  for (const key of localeKeys) {
    let isStateKey = false;
    for (const suffix of STATUS_KEY_SUFFIXES) {
      if (key.endsWith(suffix)) { isStateKey = true; break; }
    }
    if (!isStateKey) {
      localeContentKeys.push(key);
      contentKeys.add(key);
    }
  }

  for (const key of localeKeys) {
    for (const suffix of STATUS_KEY_SUFFIXES) {
      if (key.endsWith(suffix)) {
        const contentKey = key.slice(0, -suffix.length);
        if (contentKeys.has(contentKey)) {
          break;
        }
      }
    }
    for (const field of NESTED_STATUS_FIELDS) {
      const dotField = '.' + field;
      if (key.endsWith(dotField)) {
        const contentKey = key.slice(0, -dotField.length);
        if (contentKeys.has(contentKey)) {
          break;
        }
      }
    }
  }

  return {
    baseKeys,
    localeKeys,
    localeContentKeys,
    contentKeys
  };
}

const DEFAULT_CONFIG = {
  baseLocale: 'en',
  placeholderPattern: /\{(\w+)\}/g,
  lengthCheck: {
    enabled: false,
    maxLength: null,
    minLength: 0
  },
  reviewStatus: {
    enabled: false,
    requiredStatus: ['approved', 'translated']
  },
  outputFormat: OUTPUT_FORMATS.TEXT,
  strictMode: false,
  failOnWarnings: false
};

module.exports = {
  EXIT_CODES,
  ERROR_TYPES,
  SEVERITY,
  OUTPUT_FORMATS,
  STATUS_KEY_SUFFIXES,
  NESTED_STATUS_FIELDS,
  isStatusKey,
  getContentKeyForStatusKey,
  collectContentKeys,
  DEFAULT_CONFIG
};
