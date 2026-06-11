'use strict';

const { execFileSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const tmp = require('tmp');
const { EXIT_CODES } = require('../src/index');

const CLI_PATH = path.join(__dirname, '..', 'bin', 'i18n-diff.js');
const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');

describe('CLI exit codes and report format', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({ unsafeCleanup: true });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  function runCli(args, options = {}) {
    const result = spawnSync('node', [CLI_PATH, ...args], {
      cwd: options.cwd || process.cwd(),
      env: process.env,
      encoding: 'utf8',
      timeout: 10000
    });
    return {
      exitCode: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error
    };
  }

  test('should return SUCCESS (0) for perfect translation', () => {
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN-perfect.json'),
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.stdout).toBeTruthy();

    const report = JSON.parse(result.stdout);
    expect(report.summary.passed).toBe(true);
    expect(report.summary.totalErrors).toBe(0);
  });

  test('should return MISSING_KEYS (4) for missing keys', () => {
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN.json'),
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.MISSING_KEYS);
    expect(result.stdout).toBeTruthy();

    const report = JSON.parse(result.stdout);
    expect(report.summary.passed).toBe(false);
    expect(report.summary.errorCounts.missing_key).toBeGreaterThan(0);
  });

  test('should return PLACEHOLDER_MISMATCH (5) for placeholder errors', () => {
    const baseData = { greeting: 'Hello, {name}!' };
    const localeData = { greeting: '你好，{wrong}！' };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = runCli([
      '--base', baseFile,
      '--locale', localeFile,
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.PLACEHOLDER_MISMATCH);

    const report = JSON.parse(result.stdout);
    expect(report.errors[0].type).toBe('placeholder_mismatch');
    expect(report.errors[0].key).toBe('greeting');
    expect(report.errors[0].details.missingPlaceholders).toEqual(['name']);
    expect(report.errors[0].details.extraPlaceholders).toEqual(['wrong']);
  });

  test('should return LENGTH_VIOLATION (6) for length errors', () => {
    const baseData = {
      short: 'Short',
      long: 'This is a very long text that exceeds the limit'
    };
    const localeData = {
      short: '短',
      long: '这是一段非常长的文本超过了限制'
    };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = runCli([
      '--base', baseFile,
      '--locale', localeFile,
      '--max-length', '10',
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.LENGTH_VIOLATION);

    const report = JSON.parse(result.stdout);
    const lengthError = report.errors.find(e => e.type === 'length_too_long');
    expect(lengthError).toBeDefined();
    expect(lengthError.details.actualLength).toBeGreaterThan(10);
  });

  test('should return FILE_NOT_FOUND (2) for non-existent file', () => {
    const result = runCli([
      '--base', path.join(tmpDir.name, 'nonexistent.json'),
      '--locale', path.join(EXAMPLES_DIR, 'base.json'),
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.FILE_NOT_FOUND);
  });

  test('should return INVALID_JSON (3) for invalid JSON', () => {
    const invalidFile = path.join(tmpDir.name, 'invalid.json');
    fs.writeFileSync(invalidFile, '{ this is not valid json }');

    const result = runCli([
      '--base', invalidFile,
      '--locale', path.join(EXAMPLES_DIR, 'base.json'),
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.INVALID_JSON);
  });

  test('should return VALIDATION_ERROR (1) for missing required arguments', () => {
    const result = runCli(['--base', path.join(EXAMPLES_DIR, 'base.json')]);
    expect(result.exitCode).toBe(EXIT_CODES.VALIDATION_ERROR);
  });

  test('should export missing keys to JSON file with --missing', () => {
    const missingOutput = path.join(tmpDir.name, 'missing-keys.json');
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN.json'),
      '--missing',
      '--missing-output', missingOutput,
      '--quiet'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.MISSING_KEYS);
    expect(fs.existsSync(missingOutput)).toBe(true);

    const missingKeys = JSON.parse(fs.readFileSync(missingOutput, 'utf8'));
    expect(missingKeys.user.profile.address).toBe('Address');
  });

  test('should generate CSV report with --csv option', () => {
    const csvOutput = path.join(tmpDir.name, 'report.csv');
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN-perfect.json'),
      '--csv', csvOutput
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(fs.existsSync(csvOutput)).toBe(true);

    const content = fs.readFileSync(csvOutput, 'utf8');
    expect(content).toContain('severity,type,key,message');
  });

  test('should generate JSON report with --json option', () => {
    const jsonOutput = path.join(tmpDir.name, 'report.json');
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN-perfect.json'),
      '--json', jsonOutput
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(fs.existsSync(jsonOutput)).toBe(true);

    const report = JSON.parse(fs.readFileSync(jsonOutput, 'utf8'));
    expect(report.schemaVersion).toBe('1.0');
    expect(report.summary.passed).toBe(true);
  });

  test('should treat extra keys as errors in strict mode', () => {
    const baseData = { a: '1' };
    const localeData = { a: '一', b: '二' };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = runCli([
      '--base', baseFile,
      '--locale', localeFile,
      '--strict',
      '-f', 'json'
    ]);

    expect(result.exitCode).not.toBe(EXIT_CODES.SUCCESS);

    const report = JSON.parse(result.stdout);
    const extraKeyError = report.errors.find(e => e.type === 'extra_key');
    expect(extraKeyError).toBeDefined();
    expect(extraKeyError.severity).toBe('error');
  });

  test('should display benchmark data with --benchmark', () => {
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN-perfect.json'),
      '--benchmark',
      '--quiet'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.stderr).toContain('性能');
    expect(result.stderr).toContain('执行时间');
  });

  test('should return proper error object with location details', () => {
    const baseData = { common: { greeting: 'Hello, {name}!' } };
    const localeData = { common: { greeting: '你好，{wrong}！' } };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = runCli([
      '--base', baseFile,
      '--locale', localeFile,
      '-f', 'json'
    ]);

    const report = JSON.parse(result.stdout);
    const error = report.errors[0];

    expect(error.key).toBe('common.greeting');
    expect(error.details.basePath).toContain('base.json');
    expect(error.details.localePath).toContain('locale.json');
    expect(error.baseValue).toBe('Hello, {name}!');
    expect(error.localeValue).toBe('你好，{wrong}！');
  });

  test('should work with relative paths', () => {
    const result = runCli([
      '--base', 'examples/base.json',
      '--locale', 'examples/zh-CN-perfect.json',
      '-f', 'json'
    ], { cwd: path.join(__dirname, '..') });

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
  });

  test('should handle Windows-style paths on any platform', () => {
    const basePath = path.join(EXAMPLES_DIR, 'base.json').replace(/\//g, '\\');
    const localePath = path.join(EXAMPLES_DIR, 'zh-CN-perfect.json').replace(/\//g, '\\');

    const result = runCli([
      '--base', basePath,
      '--locale', localePath,
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
  });

  test('should output machine-readable JSON that is parseable', () => {
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN.json'),
      '-f', 'json'
    ]);

    expect(() => JSON.parse(result.stdout)).not.toThrow();
    const report = JSON.parse(result.stdout);

    expect(report).toHaveProperty('schemaVersion');
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('errors');
    expect(report).toHaveProperty('warnings');
    expect(report.summary).toHaveProperty('totalErrors');
    expect(report.summary).toHaveProperty('totalWarnings');
    expect(report.summary).toHaveProperty('passed');
  });

  test('should check review status with --require-review', () => {
    const result = runCli([
      '--base', path.join(EXAMPLES_DIR, 'base.json'),
      '--locale', path.join(EXAMPLES_DIR, 'zh-CN-with-status.json'),
      '--require-review',
      '-f', 'json'
    ]);

    expect(result.exitCode).toBe(EXIT_CODES.REVIEW_STATUS_ERROR);

    const report = JSON.parse(result.stdout);
    const statusError = report.errors.find(e => e.type === 'review_status_invalid');
    expect(statusError).toBeDefined();
    expect(statusError.key).toBe('common.loading');
    expect(statusError.details.actualStatus).toBe('draft');
  });

  test('should display help when no arguments provided', () => {
    const result = runCli(['--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('i18n-diff');
    expect(result.stdout).toContain('--base');
    expect(result.stdout).toContain('--locale');
  });

  test('should output version with --version', () => {
    const result = runCli(['--version']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
