'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const tmp = require('tmp');
const { checkI18nDiff, EXIT_CODES, ERROR_TYPES } = require('../src/index');
const { OUTPUT_FORMATS } = require('../lib/constants');

describe('integration tests', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({ unsafeCleanup: true });
  });

  afterEach(() => {
    tmpDir.removeCallback();
  });

  test('should check perfect translation and return success', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN-perfect.json');

    const result = await checkI18nDiff(basePath, localePath, {});

    expect(result.success).toBe(true);
    expect(result.exitCode).toBe(EXIT_CODES.SUCCESS);
    expect(result.summary.totalErrors).toBe(0);
    expect(result.summary.totalWarnings).toBe(0);
    expect(result.metadata.basePath).toContain('base.json');
    expect(result.metadata.localePath).toContain('zh-CN-perfect.json');
  });

  test('should detect missing keys and return MISSING_KEYS exit code', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN.json');

    const result = await checkI18nDiff(basePath, localePath, {});

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.MISSING_KEYS);
    expect(result.summary.errorCounts[ERROR_TYPES.MISSING_KEY]).toBe(1);
    expect(result.results.keyCheck.stats.missingKeys).toBe(1);
  });

  test('should detect placeholder mismatch and return PLACEHOLDER_MISMATCH exit code', async () => {
    const baseData = {
      common: {
        greeting: 'Hello, {name}!',
        message: 'You have {count} messages'
      }
    };
    const localeData = {
      common: {
        greeting: '你好，{wrong_name}！',
        message: '你有 {count} 条消息'
      }
    };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, {});

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.PLACEHOLDER_MISMATCH);
    expect(result.summary.errorCounts[ERROR_TYPES.PLACEHOLDER_MISMATCH]).toBe(1);
  });

  test('should detect empty values as errors', async () => {
    const baseData = {
      greeting: 'Hello',
      welcome: 'Welcome'
    };
    const localeData = {
      greeting: '',
      welcome: '欢迎'
    };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, {});

    expect(result.success).toBe(false);
    expect(result.summary.errorCounts[ERROR_TYPES.EMPTY_VALUE]).toBe(1);
  });

  test('should export missing keys when --missing option is set', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN.json');

    const result = await checkI18nDiff(basePath, localePath, { missing: true });

    expect(result.missingKeys).toBeDefined();
    expect(result.missingKeys.user).toBeDefined();
    expect(result.missingKeys.user.profile.address).toBe('Address');
  });

  test('should generate text report correctly', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN-perfect.json');

    const result = await checkI18nDiff(basePath, localePath, {});
    const report = result.getReport(OUTPUT_FORMATS.TEXT);

    expect(report).toContain('多语言文案差异检查报告');
    expect(report).toContain('总错误数: 0');
    expect(report).toContain('所有检查通过');
  });

  test('should generate JSON report with correct schema', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN-perfect.json');

    const result = await checkI18nDiff(basePath, localePath, {});
    const report = result.getReport(OUTPUT_FORMATS.JSON);
    const parsed = JSON.parse(report);

    expect(parsed.schemaVersion).toBe('1.0');
    expect(parsed.summary.passed).toBe(true);
    expect(parsed.summary.totalErrors).toBe(0);
    expect(Array.isArray(parsed.errors)).toBe(true);
    expect(Array.isArray(parsed.warnings)).toBe(true);
  });

  test('should generate CSV report correctly', async () => {
    const baseData = {
      greeting: 'Hello, {name}!',
      welcome: 'Welcome'
    };
    const localeData = {
      greeting: '你好，{wrong}!',
      welcome: ''
    };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, {});
    const report = result.getReport(OUTPUT_FORMATS.CSV);

    expect(report).toContain('severity,type,key,message');
    expect(report).toContain('placeholder_mismatch');
    expect(report).toContain('empty_value');
  });

  test('should handle file not found error', async () => {
    const result = await checkI18nDiff(
      path.join(tmpDir.name, 'nonexistent.json'),
      path.join(__dirname, '..', 'examples', 'base.json'),
      {}
    );

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.FILE_NOT_FOUND);
    expect(result.error).toBeDefined();
  });

  test('should handle invalid JSON error', async () => {
    const invalidFile = path.join(tmpDir.name, 'invalid.json');
    fs.writeFileSync(invalidFile, '{ invalid json }');

    const result = await checkI18nDiff(
      invalidFile,
      path.join(__dirname, '..', 'examples', 'base.json'),
      {}
    );

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.INVALID_JSON);
    expect(result.error.type).toBe(ERROR_TYPES.JSON_PARSE_ERROR);
  });

  test('should treat extra keys as warnings by default', async () => {
    const baseData = { a: '1' };
    const localeData = { a: '一', b: '二' };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, {});

    expect(result.success).toBe(true);
    expect(result.summary.totalWarnings).toBe(1);
    expect(result.summary.warningCounts[ERROR_TYPES.EXTRA_KEY]).toBe(1);
  });

  test('should treat extra keys as errors in strict mode', async () => {
    const baseData = { a: '1' };
    const localeData = { a: '一', b: '二' };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, { strict: true });

    expect(result.success).toBe(false);
    expect(result.summary.totalErrors).toBe(1);
    expect(result.summary.errorCounts[ERROR_TYPES.EXTRA_KEY]).toBe(1);
  });

  test('should fail on warnings when failOnWarnings is true', async () => {
    const baseData = { a: '1' };
    const localeData = { a: '一', b: '二' };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, { failOnWarnings: true });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.VALIDATION_ERROR);
  });

  test('should check length when maxLength is set', async () => {
    const baseData = {
      short: 'Short',
      long: 'This is a very long text that should fail length check'
    };
    const localeData = {
      short: '短',
      long: '这是一段非常长的文本应该会失败长度检查'
    };

    const baseFile = path.join(tmpDir.name, 'base.json');
    const localeFile = path.join(tmpDir.name, 'locale.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, { maxLength: 10 });

    expect(result.success).toBe(false);
    expect(result.exitCode).toBe(EXIT_CODES.LENGTH_VIOLATION);
    expect(result.summary.errorCounts[ERROR_TYPES.LENGTH_TOO_LONG]).toBe(1);
  });

  test('should include performance metrics', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN-perfect.json');

    const result = await checkI18nDiff(basePath, localePath, {});

    expect(result.performance).toBeDefined();
    expect(typeof result.performance.durationMs).toBe('number');
    expect(result.performance.durationMs).toBeGreaterThan(0);
  });

  test('should write report to file', async () => {
    const basePath = path.join(__dirname, '..', 'examples', 'base.json');
    const localePath = path.join(__dirname, '..', 'examples', 'zh-CN-perfect.json');
    const outputPath = path.join(tmpDir.name, 'report.json');

    const result = await checkI18nDiff(basePath, localePath, {});
    const writeResult = result.writeReport(outputPath, OUTPUT_FORMATS.JSON);

    expect(writeResult.success).toBe(true);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
    expect(content.summary.totalErrors).toBe(0);
    expect(content.errors.length).toBe(0);
  });

  test('should handle stdin input with - placeholder', async () => {
    const baseData = { greeting: 'Hello, {name}!' };
    const baseFile = path.join(tmpDir.name, 'base.json');
    fs.writeFileSync(baseFile, JSON.stringify(baseData));

    const mockStdinContent = JSON.stringify({ greeting: '你好，{name}！' });
    const { spawnSync } = require('child_process');

    const result = spawnSync('node', [
      path.join(__dirname, '..', 'bin', 'i18n-diff.js'),
      '--base', baseFile,
      '--locale', '-',
      '-f', 'json'
    ], {
      input: mockStdinContent,
      encoding: 'utf8',
      timeout: 5000
    });

    expect(result.status).toBe(EXIT_CODES.SUCCESS);
    const report = JSON.parse(result.stdout);
    expect(report.summary.totalErrors).toBe(0);
    expect(report.summary.passed).toBe(true);
  });

  test('should handle cross-platform paths', async () => {
    const baseData = { test: 'value' };
    const localeData = { test: '值' };

    const baseFile = path.join(tmpDir.name, 'nested', 'dir', 'base.json');
    const localeFile = path.join(tmpDir.name, 'nested', 'dir', 'locale.json');

    fs.mkdirSync(path.dirname(baseFile), { recursive: true });
    fs.writeFileSync(baseFile, JSON.stringify(baseData));
    fs.writeFileSync(localeFile, JSON.stringify(localeData));

    const result = await checkI18nDiff(baseFile, localeFile, {});

    expect(result.success).toBe(true);
    expect(result.metadata.basePath).toContain('base.json');
    expect(result.metadata.localePath).toContain('locale.json');
  });
});
