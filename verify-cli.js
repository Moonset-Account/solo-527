'use strict';

const { EXIT_CODES } = require('./src/index');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawnSync } = require('child_process');

const CLI_PATH = path.join(__dirname, 'bin', 'i18n-diff.js');
const EXAMPLES = path.join(__dirname, 'examples');

let passed = 0;
let failed = 0;

function run(name, args, input, expectedExitCode, checkOutput) {
  process.stdout.write(`  ${name}... `);
  const result = spawnSync('node', [CLI_PATH, ...args], {
    encoding: 'utf8',
    input: input || '',
    timeout: 10000
  });
  const code = result.status;
  if (code === expectedExitCode) {
    let ok = true;
    if (checkOutput) {
      try { ok = checkOutput(result.stdout, result.stderr); } catch (e) { ok = false; }
    }
    if (ok) {
      console.log(`✓ (退出码: ${code})`);
      passed++;
    } else {
      console.log(`✗ (退出码: ${code}, 输出检查失败)`);
      failed++;
    }
  } else {
    console.log(`✗ (期望: ${expectedExitCode}, 实际: ${code})`);
    if (result.stderr) console.log(`    stderr: ${result.stderr.substring(0, 100)}`);
    failed++;
  }
}

console.log('=== i18n-diff CLI 功能验证 ===\n');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-test-'));

console.log('【退出码验证】');
run('SUCCESS - 完美翻译',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN-perfect.json'), '--quiet'],
  null, EXIT_CODES.SUCCESS);

run('MISSING_KEYS (4) - 缺失键/空值',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN.json'), '--quiet'],
  null, EXIT_CODES.MISSING_KEYS);

run('FILE_NOT_FOUND (2) - 不存在的文件',
  ['--base', '/nonexistent/base.json', '--locale', path.join(EXAMPLES, 'base.json'), '--quiet'],
  null, EXIT_CODES.FILE_NOT_FOUND);

run('INVALID_JSON (3) - 无效 JSON',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', '-', '-f', 'json', '--quiet'],
  '{ invalid json', EXIT_CODES.INVALID_JSON);

run('VALIDATION_ERROR (1) - 缺少 --locale 参数',
  ['--base', path.join(EXAMPLES, 'base.json'), '--quiet'],
  null, EXIT_CODES.VALIDATION_ERROR);

const fullWithStatus = JSON.parse(JSON.stringify(
  JSON.parse(fs.readFileSync(path.join(EXAMPLES, 'zh-CN-perfect.json'), 'utf8'))
));
fullWithStatus.common.greeting_status = 'approved';
fullWithStatus.common.welcome_status = 'approved';
fullWithStatus.common.loading_status = 'draft';
fullWithStatus.common.error_status = 'approved';
const statusFile = path.join(tmpDir, 'with-status.json');
fs.writeFileSync(statusFile, JSON.stringify(fullWithStatus, null, 2));
run('REVIEW_STATUS_ERROR (7) - 审核状态无效',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', statusFile, '--require-review', '--quiet'],
  null, EXIT_CODES.REVIEW_STATUS_ERROR);
fs.writeFileSync(path.join(tmpDir, 'a.json'), JSON.stringify({
  short: 'Hi', long: 'This text is way too long to pass length validation'
}));
fs.writeFileSync(path.join(tmpDir, 'b.json'), JSON.stringify({
  short: '你好', long: '这段文字实在太长了无法通过长度验证'
}));
run('LENGTH_VIOLATION (6) - 长度超限',
  ['--base', path.join(tmpDir, 'a.json'), '--locale', path.join(tmpDir, 'b.json'), '--max-length', '10', '--quiet'],
  null, EXIT_CODES.LENGTH_VIOLATION);

fs.writeFileSync(path.join(tmpDir, 'c.json'), JSON.stringify({ g: 'Hello {name}' }));
fs.writeFileSync(path.join(tmpDir, 'd.json'), JSON.stringify({ g: '你好 {wrong}' }));
run('PLACEHOLDER_MISMATCH (5) - 占位符错误',
  ['--base', path.join(tmpDir, 'c.json'), '--locale', path.join(tmpDir, 'd.json'), '--quiet'],
  null, EXIT_CODES.PLACEHOLDER_MISMATCH);

console.log('\n【报告格式验证】');
run('JSON 格式 - schema 完整',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN-perfect.json'), '-f', 'json'],
  null, EXIT_CODES.SUCCESS, (stdout) => {
    const r = JSON.parse(stdout);
    return r.schemaVersion === '1.0' &&
      r.summary.totalErrors === 0 &&
      r.summary.passed === true &&
      Array.isArray(r.errors) &&
      Array.isArray(r.warnings) &&
      r.stats && r.stats.keys;
  });

run('CSV 格式 - 包含表头',
  ['--base', path.join(tmpDir, 'c.json'), '--locale', path.join(tmpDir, 'd.json'), '-f', 'csv'],
  null, EXIT_CODES.PLACEHOLDER_MISMATCH, (stdout) => {
    return stdout.startsWith('severity,type,key,message') &&
      stdout.includes('placeholder_mismatch');
  });

run('TEXT 格式 - 中文标题',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN-perfect.json'), '-f', 'text'],
  null, EXIT_CODES.SUCCESS, (stdout) => {
    return stdout.includes('多语言文案差异检查报告') &&
      stdout.includes('所有检查通过');
  });

console.log('\n【CI 友好特性】');
run('机器可读 JSON 稳定输出',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN.json'), '-f', 'json'],
  null, EXIT_CODES.MISSING_KEYS, (stdout) => {
    const r = JSON.parse(stdout);
    const firstError = r.errors[0];
    return firstError &&
      typeof firstError.key === 'string' &&
      firstError.details &&
      ('basePath' in firstError.details) &&
      ('localePath' in firstError.details);
  });

run('--missing 导出待翻译文件',
  ['--base', path.join(EXAMPLES, 'base.json'), '--locale', path.join(EXAMPLES, 'zh-CN.json'), '--missing', '--missing-output', path.join(tmpDir, 'missing.json'), '--quiet'],
  null, EXIT_CODES.MISSING_KEYS, () => {
    const p = path.join(tmpDir, 'missing.json');
    if (!fs.existsSync(p)) return false;
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    return m.user && m.user.profile && m.user.profile.address === 'Address';
  });

run('--csv 快捷选项',
  ['--base', path.join(tmpDir, 'c.json'), '--locale', path.join(tmpDir, 'd.json'), '--csv', path.join(tmpDir, 'r.csv')],
  null, EXIT_CODES.PLACEHOLDER_MISMATCH, () => {
    const p = path.join(tmpDir, 'r.csv');
    if (!fs.existsSync(p)) return false;
    return fs.readFileSync(p, 'utf8').includes('placeholder_mismatch');
  });

run('跨平台路径 - 相对路径',
  ['--base', 'examples/base.json', '--locale', 'examples/zh-CN-perfect.json', '--quiet'],
  null, EXIT_CODES.SUCCESS);

run('stdin 输入 - base 来自管道',
  ['--base', '-', '--locale', path.join(EXAMPLES, 'zh-CN-perfect.json'), '-f', 'json'],
  fs.readFileSync(path.join(EXAMPLES, 'base.json'), 'utf8'),
  EXIT_CODES.SUCCESS, (stdout) => {
    const r = JSON.parse(stdout);
    return r.summary.passed === true;
  });

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n=== 结果: 通过 ${passed}/${passed + failed} ===`);
process.exit(failed > 0 ? 1 : 0);
