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
  DEFAULT_CONFIG
};
