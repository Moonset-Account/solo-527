'use strict';

const EXIT_CODES = Object.freeze({
  SUCCESS: 0,
  BAD_LINKS_FOUND: 1,
  CONFIG_ERROR: 2,
  INVALID_ARGUMENTS: 3,
  SCAN_ERROR: 4,
  USER_ABORT: 5,
  NETWORK_ERROR: 6
});

const LINK_TYPES = Object.freeze({
  INTERNAL_FILE: 'internal_file',
  INTERNAL_ANCHOR: 'internal_anchor',
  EXTERNAL_URL: 'external_url',
  IMAGE: 'image',
  MAILTO: 'mailto',
  UNKNOWN: 'unknown'
});

const RESULT_STATUS = Object.freeze({
  OK: 'ok',
  BROKEN: 'broken',
  SKIPPED: 'skipped',
  IGNORED: 'ignored',
  WARNING: 'warning'
});

const DEFAULT_CONFIG = Object.freeze({
  root: process.cwd(),
  timeout: 5000,
  format: 'text',
  ignore: [],
  ignorePatterns: [],
  ignoreFiles: [],
  concurrency: 8,
  checkAnchors: true,
  checkExternal: true,
  checkImages: true,
  verbose: false,
  quiet: false,
  dryRun: false,
  confirmDangerous: true,
  recursive: true,
  fileExtensions: ['.md', '.markdown'],
  output: null,
  configFile: null,
  logLevel: 'info'
});

const CONFIG_FILE_NAMES = [
  '.mdlinkcheckerrc',
  '.mdlinkcheckerrc.json',
  '.mdlinkcheckerrc.yaml',
  '.mdlinkcheckerrc.yml',
  '.mdlinkcheckerrc.js',
  'mdlinkchecker.config.js',
  'mdlinkchecker.config.json',
  'mdlinkchecker.config.yaml',
  'mdlinkchecker.config.yml'
];

const LOG_LEVELS = Object.freeze({
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
});

module.exports = {
  EXIT_CODES,
  LINK_TYPES,
  RESULT_STATUS,
  DEFAULT_CONFIG,
  CONFIG_FILE_NAMES,
  LOG_LEVELS
};
