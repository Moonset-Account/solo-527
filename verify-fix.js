'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { checkI18nDiff, EXIT_CODES, ERROR_TYPES } = require('./src/index');

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, msg) {
  if (actual === expected) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.log(`  ✗ ${msg} (期望: ${expected}, 实际: ${actual})`);
    failed++;
  }
}

function assertTrue(condition, msg) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.log(`  ✗ ${msg}`);
    failed++;
  }
}

(async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-fix-'));

  console.log('\n=== 修复验证 ===');

  const base = { common: { greeting: 'Hello', welcome: 'Welcome' } };
  const locale = { 
    common: { 
      greeting: '你好', 
      greeting_status: 'approved',
      welcome: '欢迎',
      welcome_review: 'draft',
      extra_regular_key: '这是真正的多余键'
    } 
  };
  const baseFile = path.join(tmpDir, 'base.json');
  const localeFile = path.join(tmpDir, 'locale.json');
  fs.writeFileSync(baseFile, JSON.stringify(base));
  fs.writeFileSync(localeFile, JSON.stringify(locale));

  console.log('\n【1】状态字段在 --strict 下不被识别为 extra_key');
  const result = await checkI18nDiff(baseFile, localeFile, { strict: true });
  const extraKeyErrors = result.results.keyCheck.errors.filter(e => e.type === ERROR_TYPES.EXTRA_KEY);
  assertEqual(extraKeyErrors.length, 1, '只有真正的非状态多余键被识别为 extra_key');
  assertEqual(extraKeyErrors[0].key, 'common.extra_regular_key', 'extra_key 正确指向非状态字段');
  assertTrue(result.results.keyCheck.stats.statusKeys === 2, 'stats 正确统计状态键数量 (2个)');
  assertTrue(result.results.keyCheck.stats.totalLocaleContentKeys === 3, 'stats 正确统计内容键数量');

  console.log('\n【2】review_status_invalid 仍能正确定位到文案 key');
  const result2 = await checkI18nDiff(baseFile, localeFile, { strict: true, requireReview: true });
  const statusErrors = result2.results.reviewCheck.errors;
  assertEqual(statusErrors.length, 1, '检测到 1 个审核状态错误');
  assertEqual(statusErrors[0].key, 'common.welcome', '错误正确定位到文案 key: common.welcome');
  assertEqual(statusErrors[0].details.actualStatus, 'draft', '正确读取实际状态值');

  console.log('\n【3】--placeholder-pattern 正确接通到配置');
  const base3 = { test: 'Hello %name%!' };
  const locale3 = { test: '你好 %wrong%!' };
  const baseFile3 = path.join(tmpDir, 'base3.json');
  const localeFile3 = path.join(tmpDir, 'locale3.json');
  fs.writeFileSync(baseFile3, JSON.stringify(base3));
  fs.writeFileSync(localeFile3, JSON.stringify(locale3));

  const result3a = await checkI18nDiff(baseFile3, localeFile3, {});
  assertEqual(result3a.results.placeholderCheck.errors.length, 0, '默认 pattern 不识别 %xxx% 占位符');

  const result3b = await checkI18nDiff(baseFile3, localeFile3, { placeholderPattern: '%(\\w+)%' });
  assertEqual(result3b.results.placeholderCheck.errors.length, 1, '自定义 pattern 正确识别 %xxx% 占位符');
  assertEqual(result3b.results.placeholderCheck.errors[0].key, 'test', '正确定位到占位符错误的 key');
  assertTrue(
    result3b.results.placeholderCheck.errors[0].details.missingPlaceholders.includes('name'),
    '正确识别缺失的占位符 name'
  );
  assertTrue(
    result3b.results.placeholderCheck.errors[0].details.extraPlaceholders.includes('wrong'),
    '正确识别多余的占位符 wrong'
  );

  console.log('\n【4】无效正则表达式返回 VALIDATION_ERROR');
  let threw = false;
  try {
    await checkI18nDiff(baseFile3, localeFile3, { placeholderPattern: '[invalid' });
  } catch (e) {
    threw = true;
    assertTrue(e.message.includes('无效的占位符正则表达式'), '错误消息正确');
  }
  assertTrue(threw, '无效正则表达式正确抛出异常');

  console.log('\n【5】CLI 测试 --placeholder-pattern 和状态字段过滤');
  const { spawnSync } = require('child_process');
  const CLI_PATH = path.join(__dirname, 'bin', 'i18n-diff.js');

  const cliResult1 = spawnSync('node', [CLI_PATH,
    '--base', baseFile, '--locale', localeFile, '--strict', '-f', 'json'
  ], { encoding: 'utf8', timeout: 10000 });
  const report1 = JSON.parse(cliResult1.stdout);
  const cliExtraErrors = report1.errors.filter(e => e.type === 'extra_key');
  assertEqual(cliExtraErrors.length, 1, 'CLI: strict 模式下状态字段不被识别为 extra_key');

  const cliResult2 = spawnSync('node', [CLI_PATH,
    '--base', baseFile3, '--locale', localeFile3,
    '--placeholder-pattern', '%(\\w+)%',
    '-f', 'json'
  ], { encoding: 'utf8', timeout: 10000 });
  const report2 = JSON.parse(cliResult2.stdout);
  assertEqual(report2.errors.filter(e => e.type === 'placeholder_mismatch').length, 1, 
    'CLI: --placeholder-pattern 正确检测占位符错误');
  assertEqual(cliResult2.status, EXIT_CODES.PLACEHOLDER_MISMATCH, 
    'CLI: 正确返回 PLACEHOLDER_MISMATCH 退出码');

  const cliResult3 = spawnSync('node', [CLI_PATH,
    '--base', baseFile3, '--locale', localeFile3,
    '--placeholder-pattern', '[invalid',
    '-f', 'json'
  ], { encoding: 'utf8', timeout: 10000 });
  assertEqual(cliResult3.status, EXIT_CODES.VALIDATION_ERROR, 
    'CLI: 无效正则表达式返回 VALIDATION_ERROR (1)');

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log(`\n=== 结果: 通过 ${passed}/${passed + failed} ===`);
  process.exit(failed > 0 ? 1 : 0);
})();
